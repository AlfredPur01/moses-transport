import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Gender, IDType, KYCSubmitPayload, MaritalStatus,
  RelationshipType, RelativePayload, kycApi,
} from '@/api/kyc';
import { userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getApiErrorMessage } from '@/utils/error';

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  'Personal Info',
  'Address',
  'Identification',
  'Experience',
  'Background',
  'Relatives',
  'Guarantor',
  'Agreement',
];

// ── small helpers ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, keyboardType = 'default', multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.secondary}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const MIN_DOB = new Date(1900, 0, 1); // Jan 1 1900
const MAX_DOB = new Date();
MAX_DOB.setFullYear(MAX_DOB.getFullYear() - 18);

function DatePickerField({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const parsed = value ? new Date(value) : null;
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parsed ?? MAX_DOB);

  const formatDisplay = (d: Date) => {
    const day   = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year  = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const commitDate = (d: Date) => {
    const iso = d.toISOString().split('T')[0]; // YYYY-MM-DD
    onChange(iso);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && date) commitDate(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => { setTempDate(parsed ?? MAX_DOB); setShowPicker(true); }}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.text} />
        <Text style={[styles.dateBtnTxt, !parsed && styles.dateBtnPlaceholder]}>
          {parsed ? formatDisplay(parsed) : 'Select date of birth'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.text} />
      </TouchableOpacity>

      {/* Android: shows inline dialog — no modal needed */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={tempDate}
          minimumDate={MIN_DOB}
          maximumDate={MAX_DOB}
          onChange={onPickerChange}
        />
      )}

      {/* iOS: wrap in a modal with a "Done" button */}
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={showPicker} onRequestClose={() => setShowPicker(false)}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalCard}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.dateModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>Date of Birth</Text>
                <TouchableOpacity onPress={() => { commitDate(tempDate); setShowPicker(false); }}>
                  <Text style={styles.dateModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={tempDate}
                minimumDate={MIN_DOB}
                maximumDate={MAX_DOB}
                onChange={onPickerChange}
                textColor="#1A1A1A"
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function SelectRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            style={[styles.selectChip, value === o.value && styles.selectChipActive]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectChipTxt, value === o.value && styles.selectChipTxtActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PhotoPicker({
  label, hint, uri, onPick,
}: {
  label: string; hint: string; uri: string | null; onPick: (uri: string, base64: string) => void;
}) {
  const pick = async (fromCamera: boolean) => {
    const ImagePicker = await import('expo-image-picker');
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', fromCamera ? 'Camera access required.' : 'Gallery access required.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      onPick(a.uri, `data:image/jpeg;base64,${a.base64}`);
    }
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldHint}>{hint}</Text>
      {uri ? (
        <View style={styles.previewWrap}>
          <RNImage source={{ uri }} style={styles.previewImg} resizeMode="cover" />
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => Alert.alert('Change Photo', '', [
              { text: 'Camera', onPress: () => pick(true) },
              { text: 'Gallery', onPress: () => pick(false) },
              { text: 'Cancel', style: 'cancel' },
            ])}
          >
            <Text style={styles.changeBtnTxt}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={32} color={Colors.secondary} />
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pick(true)}>
              <Ionicons name="camera-outline" size={16} color={Colors.primary} />
              <Text style={styles.photoBtnTxt}>Camera</Text>
            </TouchableOpacity>
            <View style={styles.photoDivider} />
            <TouchableOpacity style={styles.photoBtn} onPress={() => pick(false)}>
              <Ionicons name="image-outline" size={16} color={Colors.primary} />
              <Text style={styles.photoBtnTxt}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── main screen ──────────────────────────────────────────────────────────────

export default function KycFormScreen() {
  const userId  = useCurrentUserId();
  const { upload, uploading } = useImageUpload();
  const { profile, loading: profileLoading } = useUserProfile();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Step 1 — personal
  const [fullName, setFullName]         = useState('');
  const [dob, setDob]                   = useState('');
  const [gender, setGender]             = useState<Gender | null>(null);
  const [maritalStatus, setMarital]     = useState<MaritalStatus | null>(null);
  const [passportUri, setPassportUri]   = useState<string | null>(null);
  const [passportB64, setPassportB64]   = useState<string | null>(null);

  // Step 2 — address
  const [address, setAddress]           = useState('');
  const [landmark, setLandmark]         = useState('');
  const [lengthOfStay, setLengthOfStay] = useState('');
  const [prevAddress, setPrevAddress]   = useState('');

  // Step 3 — ID
  const [idType, setIdType]             = useState<IDType | null>(null);
  const [idNumber, setIdNumber]         = useState('');
  const [idDocUri, setIdDocUri]         = useState<string | null>(null);
  const [idDocB64, setIdDocB64]         = useState<string | null>(null);

  // Step 4 — experience
  const [yearsRiding, setYearsRiding]   = useState('');
  const [permitNum, setPermitNum]       = useState('');
  const [prevCo, setPrevCo]             = useState('');
  const [installments, setInstallments] = useState('');
  const [obligations, setObligations]   = useState('');

  // Step 5 — background + referral
  const [stateOfOrigin, setStateOfOrigin] = useState('');
  const [localGovt, setLocalGovt]         = useState('');
  const [refName, setRefName]             = useState('');
  const [refPhone, setRefPhone]           = useState('');
  const [refAddress, setRefAddress]       = useState('');

  // Step 6 — relatives
  const [rel1Name, setRel1Name]   = useState('');
  const [rel1Phone, setRel1Phone] = useState('');
  const [rel1Addr, setRel1Addr]   = useState('');
  const [rel2Name, setRel2Name]   = useState('');
  const [rel2Phone, setRel2Phone] = useState('');
  const [rel2Addr, setRel2Addr]   = useState('');

  // Step 7 — guarantor
  const [gName, setGName]               = useState('');
  const [gPhone, setGPhone]             = useState('');
  const [gAltPhone, setGAltPhone]       = useState('');
  const [gRelType, setGRelType]         = useState<RelationshipType | null>(null);
  const [gYears, setGYears]             = useState('');
  const [gAddress, setGAddress]         = useState('');
  const [gWorkplace, setGWorkplace]     = useState('');
  const [gState, setGState]             = useState('');
  const [gLga, setGLga]                 = useState('');
  const [gIdType, setGIdType]           = useState('');
  const [gIdNum, setGIdNum]             = useState('');
  const [gOccupation, setGOccupation]   = useState('');
  const [gEmployer, setGEmployer]       = useState('');
  const [gConsent, setGConsent]         = useState(false);
  const [gPhotoUri, setGPhotoUri]       = useState<string | null>(null);
  const [gPhotoB64, setGPhotoB64]       = useState<string | null>(null);

  // Step 7 — guarantor 2
  const [g2Name, setG2Name]             = useState('');
  const [g2Phone, setG2Phone]           = useState('');
  const [g2AltPhone, setG2AltPhone]     = useState('');
  const [g2RelType, setG2RelType]       = useState<RelationshipType | null>(null);
  const [g2Years, setG2Years]           = useState('');
  const [g2Address, setG2Address]       = useState('');
  const [g2Workplace, setG2Workplace]   = useState('');
  const [g2State, setG2State]           = useState('');
  const [g2Lga, setG2Lga]               = useState('');
  const [g2IdType, setG2IdType]         = useState('');
  const [g2IdNum, setG2IdNum]           = useState('');
  const [g2Occupation, setG2Occupation] = useState('');
  const [g2Employer, setG2Employer]     = useState('');
  const [g2Consent, setG2Consent]       = useState(false);
  const [g2PhotoUri, setG2PhotoUri]     = useState<string | null>(null);
  const [g2PhotoB64, setG2PhotoB64]     = useState<string | null>(null);

  // Step 8 — agreement
  const [consentData, setConsentData]     = useState(false);
  const [consentAsset, setConsentAsset]   = useState(false);
  const [sigUri, setSigUri]               = useState<string | null>(null);
  const [sigB64, setSigB64]               = useState<string | null>(null);

  // Pre-fill
  const [initialLoading, setInitialLoading] = useState(true);
  const [adminNote, setAdminNote]           = useState<string | null>(null);

  useEffect(() => {
    userApi.getKycData().then(({ data: d }) => {
      // personal
      if (d.full_name)       setFullName(d.full_name);
      if (d.date_of_birth)   setDob(d.date_of_birth);
      if (d.gender)          setGender(d.gender as Gender);
      if (d.marital_status)  setMarital(d.marital_status as MaritalStatus);
      if (d.profile_photo)   setPassportUri(d.profile_photo);
      // address
      if (d.address)         setAddress(d.address);
      if (d.landmark)        setLandmark(d.landmark);
      if (d.length_of_stay)  setLengthOfStay(d.length_of_stay);
      if (d.previous_address) setPrevAddress(d.previous_address);
      // ID
      if (d.id_type)         setIdType(d.id_type as IDType);
      if (d.id_number)       setIdNumber(d.id_number);
      if (d.id_document_url) setIdDocUri(d.id_document_url);
      // experience
      if (d.years_riding !== undefined && d.years_riding !== null) setYearsRiding(String(d.years_riding));
      if (d.riders_permit_number) setPermitNum(d.riders_permit_number);
      if (d.prev_transport_co)    setPrevCo(d.prev_transport_co);
      if (d.installments_done !== undefined && d.installments_done !== null) setInstallments(String(d.installments_done));
      if (d.existing_obligations) setObligations(d.existing_obligations);
      // background
      if (d.state_of_origin) setStateOfOrigin(d.state_of_origin);
      if (d.local_govt)      setLocalGovt(d.local_govt);
      if (d.referral_name)   setRefName(d.referral_name);
      if (d.referral_phone)  setRefPhone(d.referral_phone);
      if (d.referral_address) setRefAddress(d.referral_address);
      // relatives
      const rels = d.relatives ?? [];
      if (rels[0]) { setRel1Name(rels[0].full_name ?? ''); setRel1Phone(rels[0].phone ?? ''); setRel1Addr((rels[0] as any).address ?? ''); }
      if (rels[1]) { setRel2Name(rels[1].full_name ?? ''); setRel2Phone(rels[1].phone ?? ''); setRel2Addr((rels[1] as any).address ?? ''); }
      // guarantor (first one)
      const g = d.guarantors?.[0] as any;
      if (g) {
        setGName(g.full_name ?? '');
        setGPhone(g.phone ?? '');
        setGAltPhone(g.alternate_phone ?? '');
        if (g.relationship) setGRelType(g.relationship as RelationshipType);
        if (g.years_of_relationship) setGYears(String(g.years_of_relationship));
        setGAddress(g.address ?? '');
        setGWorkplace(g.workplace_address ?? '');
        setGState(g.state_of_origin ?? '');
        setGLga(g.local_govt ?? '');
        setGIdType(g.id_type ?? '');
        setGIdNum(g.id_number ?? g.nin ?? '');
        setGOccupation(g.occupation ?? '');
        setGEmployer(g.employer_name ?? '');
        if (g.guarantor_consent) setGConsent(true);
        if (g.profile_photo) setGPhotoUri(g.profile_photo);
      }
      // guarantor 2
      const g2 = d.guarantors?.[1] as any;
      if (g2) {
        setG2Name(g2.full_name ?? '');
        setG2Phone(g2.phone ?? '');
        setG2AltPhone(g2.alternate_phone ?? '');
        if (g2.relationship) setG2RelType(g2.relationship as RelationshipType);
        if (g2.years_of_relationship) setG2Years(String(g2.years_of_relationship));
        setG2Address(g2.address ?? '');
        setG2Workplace(g2.workplace_address ?? '');
        setG2State(g2.state_of_origin ?? '');
        setG2Lga(g2.local_govt ?? '');
        setG2IdType(g2.id_type ?? '');
        setG2IdNum(g2.id_number ?? g2.nin ?? '');
        setG2Occupation(g2.occupation ?? '');
        setG2Employer(g2.employer_name ?? '');
        if (g2.guarantor_consent) setG2Consent(true);
        if (g2.profile_photo) setG2PhotoUri(g2.profile_photo);
      }
      // agreement
      if (d.consent_data_verify)    setConsentData(true);
      if (d.consent_asset_recovery) setConsentAsset(true);
      if (d.signature_url)          setSigUri(d.signature_url);
      // admin note
      if (d.kyc_admin_note) setAdminNote(d.kyc_admin_note);
    }).catch(() => {}).finally(() => setInitialLoading(false));
  }, []);

  const canAdvance = () => {
    switch (step) {
      case 0: return !!fullName.trim() && !!dob && !!gender && !!maritalStatus;
      case 1: return !!address.trim() && !!landmark.trim() && !!lengthOfStay.trim();
      case 2: return !!idType && !!idNumber.trim();
      case 3: return true;
      case 4: return !!stateOfOrigin.trim() && !!localGovt.trim();
      case 5: return !!rel1Name.trim() && !!rel1Phone.trim();
      case 6: return !!gName.trim() && !!gPhone.trim() && gConsent && !!g2Name.trim() && !!g2Phone.trim() && g2Consent;
      case 7: return consentData && consentAsset;
      default: return false;
    }
  };

  const handleNext = () => {
    setApiError(null);
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setApiError(null);
    try {
      let passportUrl: string | undefined;
      let idDocUrl:    string | undefined;
      let gPhotoUrl:   string | undefined;
      let sigUrl:      string | undefined;

      if (passportB64 && userId) passportUrl = await upload(passportB64, `kyc/${userId}/passport`) ?? undefined;
      else if (passportUri)      passportUrl = passportUri;

      if (idDocB64    && userId) idDocUrl    = await upload(idDocB64,    `kyc/${userId}/id-doc`)   ?? undefined;
      else if (idDocUri)         idDocUrl    = idDocUri;

      if (gPhotoB64   && userId) gPhotoUrl   = await upload(gPhotoB64,   `kyc/${userId}/guarantor1`) ?? undefined;
      else if (gPhotoUri)        gPhotoUrl   = gPhotoUri;

      let g2PhotoUrl: string | undefined;
      if (g2PhotoB64  && userId) g2PhotoUrl  = await upload(g2PhotoB64,  `kyc/${userId}/guarantor2`) ?? undefined;
      else if (g2PhotoUri)       g2PhotoUrl  = g2PhotoUri;

      if (sigB64      && userId) sigUrl      = await upload(sigB64,      `kyc/${userId}/signature`) ?? undefined;
      else if (sigUri)           sigUrl      = sigUri;

      const relatives: RelativePayload[] = [];
      if (rel1Name.trim()) relatives.push({ fullName: rel1Name.trim(), phone: rel1Phone.trim(), address: rel1Addr.trim() || undefined });
      if (rel2Name.trim()) relatives.push({ fullName: rel2Name.trim(), phone: rel2Phone.trim(), address: rel2Addr.trim() || undefined });

      const payload: KYCSubmitPayload = {
        fullName:         fullName.trim()      || undefined,
        dateOfBirth:      dob                  || undefined,
        gender:           gender               ?? undefined,
        maritalStatus:    maritalStatus        ?? undefined,
        passportPhoto:    passportUrl,
        address:          address.trim()       || undefined,
        landmark:         landmark.trim()      || undefined,
        lengthOfStay:     lengthOfStay.trim()  || undefined,
        previousAddress:  prevAddress.trim()   || undefined,
        idType:           idType               ?? undefined,
        idNumber:         idNumber.trim()      || undefined,
        idDocumentUrl:    idDocUrl,
        yearsRiding:      yearsRiding ? Number(yearsRiding) : undefined,
        ridersPermitNumber: permitNum.trim()   || undefined,
        prevTransportCo:  prevCo.trim()        || undefined,
        installmentsDone: installments ? Number(installments) : undefined,
        existingObligations: obligations.trim() || undefined,
        stateOfOrigin:    stateOfOrigin.trim() || undefined,
        localGovt:        localGovt.trim()     || undefined,
        referralName:     refName.trim()       || undefined,
        referralPhone:    refPhone.trim()      || undefined,
        referralAddress:  refAddress.trim()    || undefined,
        consentDataVerify:    consentData,
        consentAssetRecovery: consentAsset,
        signatureUrl:     sigUrl,
        relatives:  relatives.length > 0 ? relatives : undefined,
        guarantors: [
          ...(gName.trim() ? [{
            fullName:            gName.trim(),
            phone:               gPhone.trim(),
            alternatePhone:      gAltPhone.trim()   || undefined,
            passportPhoto:       gPhotoUrl,
            relationshipType:    gRelType           ?? undefined,
            yearsOfRelationship: gYears ? Number(gYears) : undefined,
            houseAddress:        gAddress.trim()    || undefined,
            workplaceAddress:    gWorkplace.trim()  || undefined,
            stateOfOrigin:       gState.trim()      || undefined,
            localGovt:           gLga.trim()        || undefined,
            idType:              gIdType.trim()     || undefined,
            idNumber:            gIdNum.trim()      || undefined,
            occupation:          gOccupation.trim() || undefined,
            employerName:        gEmployer.trim()   || undefined,
            consent:             gConsent,
          }] : []),
          ...(g2Name.trim() ? [{
            fullName:            g2Name.trim(),
            phone:               g2Phone.trim(),
            alternatePhone:      g2AltPhone.trim()  || undefined,
            passportPhoto:       g2PhotoUrl,
            relationshipType:    g2RelType          ?? undefined,
            yearsOfRelationship: g2Years ? Number(g2Years) : undefined,
            houseAddress:        g2Address.trim()   || undefined,
            workplaceAddress:    g2Workplace.trim() || undefined,
            stateOfOrigin:       g2State.trim()     || undefined,
            localGovt:           g2Lga.trim()       || undefined,
            idType:              g2IdType.trim()     || undefined,
            idNumber:            g2IdNum.trim()     || undefined,
            occupation:          g2Occupation.trim()|| undefined,
            employerName:        g2Employer.trim()  || undefined,
            consent:             g2Consent,
          }] : []),
        ],
      };

      await kycApi.submitKyc(payload);
      router.replace('/(main)/(profile)/kyc/pending');
    } catch (err) {
      setApiError(getApiErrorMessage(err) ?? 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  const busy = submitting || uploading;

  if (profileLoading || initialLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 14, color: Colors.textSecondary }}>Loading your details…</Text>
      </SafeAreaView>
    );
  }

  if (profile?.application_fee_paid === false) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }]}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="receipt-outline" size={44} color={Colors.primary} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' }}>
          Application Fee Required
        </Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>
          Please pay the application fee before completing your KYC verification.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 }}
          onPress={() => router.replace('/(main)/(vehicles)/application-fee')}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Pay Application Fee</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textDecorationLine: 'underline' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 0 ? router.back() : setStep(s => s - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerStep}>Step {step + 1} of {TOTAL_STEPS}</Text>
            <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` as any }]} />
        </View>

        {/* Admin note banner */}
        {adminNote ? (
          <View style={styles.adminNoteBanner}>
            <Ionicons name="chatbox-outline" size={16} color="#92400e" />
            <Text style={styles.adminNoteTxt} numberOfLines={3}>{adminNote}</Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 1: Personal ── */}
          {step === 0 && (
            <>
              <Field label="Full Name *" value={fullName} onChange={setFullName} placeholder="Your legal full name" />
              <DatePickerField label="Date of Birth *" value={dob} onChange={setDob} />
              <SelectRow<Gender>
                label="Gender *"
                value={gender}
                onChange={setGender}
                options={[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' },
                ]}
              />
              <SelectRow<MaritalStatus>
                label="Marital Status *"
                value={maritalStatus}
                onChange={setMarital}
                options={[
                  { label: 'Single', value: 'single' },
                  { label: 'Married', value: 'married' },
                  { label: 'Divorced', value: 'divorced' },
                  { label: 'Widowed', value: 'widowed' },
                ]}
              />
              <PhotoPicker
                label="Passport Photograph"
                hint="Clear photo of your face against a plain background"
                uri={passportUri}
                onPick={(u, b) => { setPassportUri(u); setPassportB64(b); }}
              />
            </>
          )}

          {/* ── Step 2: Address ── */}
          {step === 1 && (
            <>
              <Field label="Current Address *" value={address} onChange={setAddress} placeholder="House no., street, area" multiline />
              <Field label="Landmark / Nearest Bus Stop *" value={landmark} onChange={setLandmark} placeholder="e.g. Opposite First Bank" />
              <Field label="Length of Stay *" value={lengthOfStay} onChange={setLengthOfStay} placeholder="e.g. 3 years" />
              <Field label="Previous Address (optional)" value={prevAddress} onChange={setPrevAddress} placeholder="Your previous home address" multiline />
            </>
          )}

          {/* ── Step 3: Identification ── */}
          {step === 2 && (
            <>
              <SelectRow<IDType>
                label="ID Type *"
                value={idType}
                onChange={setIdType}
                options={[
                  { label: 'NIN', value: 'nin' },
                  { label: "Voter's Card", value: 'voters_card' },
                  { label: "Driver's License", value: 'drivers_license' },
                  { label: 'Int. Passport', value: 'international_passport' },
                ]}
              />
              <Field label="ID Number *" value={idNumber} onChange={setIdNumber} placeholder="Enter your ID number" keyboardType="default" />
              <PhotoPicker
                label="Upload ID Document"
                hint="Clear photo of your selected ID document"
                uri={idDocUri}
                onPick={(u, b) => { setIdDocUri(u); setIdDocB64(b); }}
              />
            </>
          )}

          {/* ── Step 4: Experience ── */}
          {step === 3 && (
            <>
              <Field label="Years of Riding Experience" value={yearsRiding} onChange={setYearsRiding} placeholder="e.g. 5" keyboardType="number-pad" />
              <Field label="Rider's Permit Number" value={permitNum} onChange={setPermitNum} placeholder="Your permit number (if any)" />
              <Field label="Previous Transport Company" value={prevCo} onChange={setPrevCo} placeholder="Company name (if any)" />
              <Field label="Installments Previously Completed" value={installments} onChange={setInstallments} placeholder="Number of installments" keyboardType="number-pad" />
              <Field label="Existing Loan Obligations" value={obligations} onChange={setObligations} placeholder="Describe any existing loans" multiline />
            </>
          )}

          {/* ── Step 5: Background + Referral ── */}
          {step === 4 && (
            <>
              <Field label="State of Origin *" value={stateOfOrigin} onChange={setStateOfOrigin} placeholder="e.g. Lagos" />
              <Field label="Local Government Area *" value={localGovt} onChange={setLocalGovt} placeholder="e.g. Ikeja" />
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Referral (Optional)</Text>
              </View>
              <Field label="Referral Name" value={refName} onChange={setRefName} placeholder="Who referred you?" />
              <Field label="Referral Phone" value={refPhone} onChange={setRefPhone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Field label="Referral Address" value={refAddress} onChange={setRefAddress} placeholder="Referral's address" multiline />
            </>
          )}

          {/* ── Step 6: Relatives ── */}
          {step === 5 && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Relative 1 *</Text>
              </View>
              <Field label="Full Name *" value={rel1Name} onChange={setRel1Name} placeholder="Relative's full name" />
              <Field label="Phone *" value={rel1Phone} onChange={setRel1Phone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Field label="Address" value={rel1Addr} onChange={setRel1Addr} placeholder="Relative's address" multiline />
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Relative 2 (Optional)</Text>
              </View>
              <Field label="Full Name" value={rel2Name} onChange={setRel2Name} placeholder="Relative's full name" />
              <Field label="Phone" value={rel2Phone} onChange={setRel2Phone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Field label="Address" value={rel2Addr} onChange={setRel2Addr} placeholder="Relative's address" multiline />
            </>
          )}

          {/* ── Step 7: Guarantors (2 required) ── */}
          {step === 6 && (
            <>
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionLabel}>Guarantor 1 *</Text>
              </View>
              <Field label="Full Name *" value={gName} onChange={setGName} placeholder="Guarantor's full name" />
              <Field label="Phone *" value={gPhone} onChange={setGPhone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Field label="Alternate Phone" value={gAltPhone} onChange={setGAltPhone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <SelectRow<RelationshipType>
                label="Relationship Type"
                value={gRelType}
                onChange={setGRelType}
                options={[
                  { label: 'Friend', value: 'friend' },
                  { label: 'Family', value: 'family' },
                  { label: 'Colleague', value: 'colleague' },
                  { label: 'Neighbour', value: 'neighbour' },
                  { label: 'Other', value: 'other' },
                ]}
              />
              <Field label="Years of Relationship" value={gYears} onChange={setGYears} placeholder="e.g. 5" keyboardType="number-pad" />
              <Field label="House Address" value={gAddress} onChange={setGAddress} placeholder="Guarantor's home address" multiline />
              <Field label="Workplace Address" value={gWorkplace} onChange={setGWorkplace} placeholder="Guarantor's workplace" multiline />
              <Field label="State" value={gState} onChange={setGState} placeholder="e.g. Lagos" />
              <Field label="LGA" value={gLga} onChange={setGLga} placeholder="e.g. Surulere" />
              <Field label="ID Type" value={gIdType} onChange={setGIdType} placeholder="NIN / Voter's Card / etc." />
              <Field label="ID Number" value={gIdNum} onChange={setGIdNum} placeholder="Guarantor's ID number" />
              <Field label="Occupation" value={gOccupation} onChange={setGOccupation} placeholder="e.g. Teacher" />
              <Field label="Employer / Business Name" value={gEmployer} onChange={setGEmployer} placeholder="Where they work or business name" />
              <PhotoPicker
                label="Guarantor Passport Photo"
                hint="Clear passport-style photo of the guarantor"
                uri={gPhotoUri}
                onPick={(u, b) => { setGPhotoUri(u); setGPhotoB64(b); }}
              />
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setGConsent(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, gConsent && styles.checkboxChecked]}>
                  {gConsent && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.consentTxt}>
                  Guarantor 1 has given their informed consent to be listed. *
                </Text>
              </TouchableOpacity>

              <View style={[styles.sectionDivider, { marginTop: Spacing.lg }]}>
                <Text style={styles.sectionLabel}>Guarantor 2 *</Text>
              </View>
              <Field label="Full Name *" value={g2Name} onChange={setG2Name} placeholder="Guarantor's full name" />
              <Field label="Phone *" value={g2Phone} onChange={setG2Phone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Field label="Alternate Phone" value={g2AltPhone} onChange={setG2AltPhone} placeholder="+2348012345678" keyboardType="phone-pad" />
              <SelectRow<RelationshipType>
                label="Relationship Type"
                value={g2RelType}
                onChange={setG2RelType}
                options={[
                  { label: 'Friend',    value: 'friend' },
                  { label: 'Family',    value: 'family' },
                  { label: 'Colleague', value: 'colleague' },
                  { label: 'Neighbour', value: 'neighbour' },
                  { label: 'Other',     value: 'other' },
                ]}
              />
              <Field label="Years of Relationship" value={g2Years} onChange={setG2Years} placeholder="e.g. 3" keyboardType="number-pad" />
              <Field label="House Address" value={g2Address} onChange={setG2Address} placeholder="Guarantor's home address" multiline />
              <Field label="Workplace Address" value={g2Workplace} onChange={setG2Workplace} placeholder="Guarantor's workplace" multiline />
              <Field label="State" value={g2State} onChange={setG2State} placeholder="e.g. Lagos" />
              <Field label="LGA" value={g2Lga} onChange={setG2Lga} placeholder="e.g. Surulere" />
              <Field label="ID Type" value={g2IdType} onChange={setG2IdType} placeholder="NIN / Voter's Card / etc." />
              <Field label="ID Number" value={g2IdNum} onChange={setG2IdNum} placeholder="Guarantor's ID number" />
              <Field label="Occupation" value={g2Occupation} onChange={setG2Occupation} placeholder="e.g. Teacher" />
              <Field label="Employer / Business Name" value={g2Employer} onChange={setG2Employer} placeholder="Where they work" />
              <PhotoPicker
                label="Guarantor 2 Passport Photo"
                hint="Clear passport-style photo of the guarantor"
                uri={g2PhotoUri}
                onPick={(u, b) => { setG2PhotoUri(u); setG2PhotoB64(b); }}
              />
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setG2Consent(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, g2Consent && styles.checkboxChecked]}>
                  {g2Consent && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.consentTxt}>
                  Guarantor 2 has given their informed consent to be listed. *
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 8: Agreement ── */}
          {step === 7 && (
            <>
              <View style={styles.agreementCard}>
                <Ionicons name="document-text-outline" size={32} color={Colors.primary} />
                <Text style={styles.agreementTitle}>Terms & Consent</Text>
                <Text style={styles.agreementBody}>
                  By submitting this form you confirm that all information provided is accurate and complete. Moses Transportation may verify your details with third-party services.
                </Text>
              </View>

              <TouchableOpacity style={styles.consentRow} onPress={() => setConsentData(v => !v)} activeOpacity={0.7}>
                <View style={[styles.checkbox, consentData && styles.checkboxChecked]}>
                  {consentData && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.consentTxt}>
                  I consent to the verification of my data by Moses Transportation. *
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.consentRow} onPress={() => setConsentAsset(v => !v)} activeOpacity={0.7}>
                <View style={[styles.checkbox, consentAsset && styles.checkboxChecked]}>
                  {consentAsset && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.consentTxt}>
                  I understand and consent to asset recovery procedures in the event of default. *
                </Text>
              </TouchableOpacity>

              <PhotoPicker
                label="Customer Signature"
                hint="Draw your signature on paper and take a photo, or upload a signature image"
                uri={sigUri}
                onPick={(u, b) => { setSigUri(u); setSigB64(b); }}
              />
            </>
          )}

          {/* Error */}
          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorTxt}>{apiError}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, (!canAdvance() || busy) && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance() || busy}
            activeOpacity={0.85}
          >
            {busy
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name={step === TOTAL_STEPS - 1 ? 'checkmark-circle' : 'arrow-forward'} size={18} color="#fff" />}
            <Text style={styles.nextBtnTxt}>
              {busy ? (uploading ? 'Uploading…' : 'Submitting…') : step === TOTAL_STEPS - 1 ? 'Submit' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn:     { padding: 4 },
  headerStep:  { fontSize: Typography.sizes.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary },

  progressTrack: { height: 4, backgroundColor: Colors.borderLight },
  progressFill:  { height: '100%', backgroundColor: Colors.primary },

  adminNoteBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#fffbeb', borderBottomWidth: 1, borderBottomColor: '#fcd34d',
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  adminNoteTxt: { flex: 1, fontSize: Typography.sizes.sm, color: '#78350f', lineHeight: 20 },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 },

  fieldWrap:  { gap: 5 },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  fieldHint:  { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  input: {
    height: 48, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.base, color: Colors.text,
    backgroundColor: Colors.inputBackground,
  },
  inputMulti: { height: 80, paddingTop: Spacing.sm, textAlignVertical: 'top' },

  dateBtn: {
    height: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, backgroundColor: '#FFFFFF',
  },
  dateBtnTxt: { flex: 1, fontSize: Typography.sizes.base, color: '#1A1A1A' },
  dateBtnPlaceholder: { color: '#9CA3AF' },

  dateModalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dateModalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  dateModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  dateModalTitle:  { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.text },
  dateModalCancel: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  dateModalDone:   { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary },

  selectRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  selectChip:        {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: '#fff',
  },
  selectChipActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectChipTxt:     { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  selectChipTxtActive: { color: '#fff' },

  previewWrap: { position: 'relative', borderRadius: BorderRadius.md, overflow: 'hidden' },
  previewImg:  { width: '100%', height: 160, borderRadius: BorderRadius.md },
  changeBtn: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, ...Shadows.sm,
  },
  changeBtnTxt:  { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.primary },
  photoPlaceholder: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, paddingVertical: Spacing.lg,
    alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card,
  },
  photoActions:  { flexDirection: 'row', alignItems: 'center' },
  photoBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  photoBtnTxt:   { fontSize: Typography.sizes.sm, color: Colors.primary, fontWeight: Typography.weights.medium },
  photoDivider:  { width: 1, height: 18, backgroundColor: Colors.border },

  sectionDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.xs },
  sectionLabel:   { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },

  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  consentTxt: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text, lineHeight: 20 },

  agreementCard: {
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  agreementTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.primary },
  agreementBody:  { fontSize: Typography.sizes.sm, color: Colors.text, textAlign: 'center', lineHeight: 20 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  errorTxt: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },

  footer: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 15, ...Shadows.md,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnTxt: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
});
