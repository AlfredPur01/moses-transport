import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { NIGERIAN_STATES } from '@/constants/nigeria';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useKycAddress } from '@/hooks/useKycAddress';

const KYC_STEPS = ['NIN', 'Selfie', 'Address', 'Guarantor'];

const schema = z.object({
  address: z.string().min(5, 'Please enter your full address'),
  stateOfOrigin: z.string().min(1, 'State of origin is required'),
  localGovt: z.string().min(2, 'Local government area is required'),
  alternatePhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{11}$/.test(v),
      'Alternate phone must be 11 digits',
    ),
});

type FormData = z.infer<typeof schema>;

export default function KycAddressScreen() {
  const { handleSubmit: submitAddress, loading, error } = useKycAddress();
  const [locating, setLocating] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: '',
      stateOfOrigin: '',
      localGovt: '',
      alternatePhone: '',
    },
  });

  const fillFromLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required to auto-fill your address.');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      // Run system geocoder (Google on Android — best Nigeria coverage) and
      // Nominatim in parallel, then combine the best of both
      const [systemResults, nominatimData] = await Promise.allSettled([
        Location.reverseGeocodeAsync(
          { latitude: coords.latitude, longitude: coords.longitude },
        ),
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
          { headers: { 'User-Agent': 'MosesTransportApp/1.0', 'Accept-Language': 'en' } },
        ).then((r) => r.json()),
      ]);

      // ── Pull data from both sources ──────────────────────────────
      const place =
        systemResults.status === 'fulfilled' ? systemResults.value?.[0] : null;
      const osm =
        nominatimData.status === 'fulfilled' && !nominatimData.value?.error
          ? nominatimData.value
          : null;
      const osmAddr = osm?.address ?? {};

      // ── Build the street-level address ───────────────────────────
      // Google geocoder (via expo-location) returns `name` which is often
      // the specific building / street address — the most useful field.
      const streetNumber = place?.streetNumber || osmAddr.house_number || '';
      const streetName   = place?.street || osmAddr.road || osmAddr.pedestrian || osmAddr.footway || '';
      const placeName    = place?.name   || '';
      const district     = place?.district || osmAddr.suburb || osmAddr.neighbourhood || osmAddr.quarter || '';
      const city         = place?.city || osmAddr.city || osmAddr.town || osmAddr.municipality || place?.subregion || '';

      // Prefer explicit street data; fall back to `name` (Google) then display_name (OSM)
      let addressStr = '';
      if (streetName) {
        addressStr = [streetNumber, streetName, district, city].filter(Boolean).join(', ');
      } else if (placeName && placeName !== city) {
        addressStr = [placeName, district, city].filter(Boolean).join(', ');
      } else if (osm?.display_name) {
        addressStr = osm.display_name
          .split(',')
          .map((s: string) => s.trim())
          .filter(
            (s: string) =>
              s !== 'Nigeria' &&
              s !== 'Federal Republic of Nigeria' &&
              !/^\d{5,6}$/.test(s),
          )
          .join(', ');
      }

      if (addressStr) setValue('address', addressStr, { shouldValidate: true });

      // ── State ────────────────────────────────────────────────────
      const rawState = place?.region || osmAddr.state || '';
      if (rawState) {
        const stateMatch = NIGERIAN_STATES.find(
          (s) =>
            rawState.toLowerCase().includes(s.value.toLowerCase()) ||
            s.value.toLowerCase().includes(rawState.toLowerCase()),
        );
        if (stateMatch) setValue('stateOfOrigin', stateMatch.value, { shouldValidate: true });
      }

      // ── LGA ──────────────────────────────────────────────────────
      const lga =
        place?.subregion ||
        osmAddr.county ||
        osmAddr.city_district ||
        osmAddr.state_district ||
        city ||
        '';
      if (lga) setValue('localGovt', lga, { shouldValidate: true });

    } catch {
      Alert.alert('Location error', 'Unable to get your location. Please enter manually.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = (data: FormData) => {
    submitAddress({
      address: data.address,
      stateOfOrigin: data.stateOfOrigin,
      localGovt: data.localGovt,
      alternatePhone: data.alternatePhone || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Address</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepWrapper}>
          <StepIndicator steps={KYC_STEPS} currentStep={2} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Ionicons name="home" size={44} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.heading}>Where do you live?</Text>
          <Text style={styles.subheading}>
            Provide your current residential address and contact details.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Auto-fill from GPS */}
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={fillFromLocation}
              disabled={locating}
              activeOpacity={0.7}
            >
              {locating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
              )}
              <Text style={styles.locationBtnText}>
                {locating ? 'Detecting location…' : 'Use my current location'}
              </Text>
            </TouchableOpacity>

            <Controller
              name="address"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Home Address"
                  placeholder="Enter your full home address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.address?.message}
                  multiline
                  numberOfLines={3}
                />
              )}
            />

            <Controller
              name="stateOfOrigin"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  label="State of Origin"
                  placeholder="Select your state"
                  value={value}
                  options={NIGERIAN_STATES}
                  onChange={onChange}
                  error={errors.stateOfOrigin?.message}
                />
              )}
            />

            <Controller
              name="localGovt"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Local Government Area (LGA)"
                  placeholder="e.g. Ikeja, Enugu North"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.localGovt?.message}
                />
              )}
            />

            <Controller
              name="alternatePhone"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Alternate Phone Number (optional)"
                  placeholder="11-digit phone number"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.alternatePhone?.message}
                />
              )}
            />

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.primary} />
              <Text style={styles.privacyText}>
                Your address is kept private and used only for loan verification.
              </Text>
            </View>

            {/* API Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Continue"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  headerSpacer: { width: 32 },
  stepWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.base * 1.6,
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    lineHeight: Typography.sizes.xs * 1.6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  locationBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
  },
});
