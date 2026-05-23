import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvailableAsset, assetApi } from '@/api/asset';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Tricycle', value: 'tricycle' },
  { label: 'Motorcycle', value: 'motorcycle' },
];

function VehicleCard({ item }: { item: AvailableAsset }) {
  const isNew = item.condition === 'new';
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/(main)/(vehicles)/${item.id}` as any)}
    >
      <View style={styles.cardIcon}>
        <Ionicons
          name={item.type === 'tricycle' ? 'car-outline' : 'bicycle-outline'}
          size={32}
          color={Colors.primary}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.brand} {item.model}
          </Text>
          <View style={[styles.conditionBadge, isNew && styles.conditionBadgeNew]}>
            <Text style={[styles.conditionTxt, isNew && styles.conditionTxtNew]}>
              {isNew ? 'New' : 'Used'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardType}>{item.type} · {item.color}</Text>

        <View style={styles.cardBottom}>
          <Text style={styles.cardPrice}>{fmt(item.market_price)}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewTxt}>View</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VehiclesScreen() {
  const [assets, setAssets] = useState<AvailableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await assetApi.getAvailable({ type: filter || undefined, limit: 50 });
      setAssets(data.assets ?? []);
    } catch {
      setError('Could not load vehicles. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Vehicles</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipTxt, filter === f.value && styles.chipTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.secondary} />
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <VehicleCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="bicycle-outline" size={52} color={Colors.secondary} />
              <Text style={styles.emptyTxt}>No vehicles available right now</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text },

  filters: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  chipTxtActive: { color: '#fff' },

  list: { padding: Spacing.lg, gap: Spacing.sm },

  card: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm,
  },
  cardIcon: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: {
    fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold,
    color: Colors.text, flex: 1, marginRight: Spacing.xs,
  },
  conditionBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full, backgroundColor: '#FEF3C7',
  },
  conditionBadgeNew: { backgroundColor: '#D1FAE5' },
  conditionTxt: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: '#92400E' },
  conditionTxtNew: { color: '#065F46' },
  cardType: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardPrice: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.primary },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewTxt: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.primary },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl },
  errorTxt: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyTxt: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  retryBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  retryTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },
});
