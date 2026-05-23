import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { Notification } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  payment_received:  'checkmark-circle-outline',
  payment_missed:    'close-circle-outline',
  payment_reminder:  'alarm-outline',
  loan_approved:     'ribbon-outline',
  loan_completed:    'trophy-outline',
  kyc_approved:      'shield-checkmark-outline',
  kyc_rejected:      'shield-outline',
  system:            'megaphone-outline',
};

const TYPE_COLOR: Record<string, string> = {
  payment_received: Colors.success,
  payment_missed:   Colors.error,
  payment_reminder: Colors.warning,
  loan_approved:    Colors.primary,
  loan_completed:   '#7C3AED',
  kyc_approved:     Colors.success,
  kyc_rejected:     Colors.error,
  system:           Colors.secondary,
};

const fmtDate = (s: string) => {
  if (!s) return '';
  const d = new Date(s);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

function NotificationCard({ item, onPress }: { item: Notification; onPress: () => void }) {
  const icon  = TYPE_ICON[item.type]  ?? 'notifications-outline';
  const color = TYPE_COLOR[item.type] ?? Colors.secondary;

  return (
    <TouchableOpacity
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <View style={styles.bodyTop}>
          <Text style={[styles.title, !item.is_read && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{fmtDate(item.created_at)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="notifications-off-outline" size={56} color={Colors.secondary} />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySub}>You're all caught up! New alerts will appear here.</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, refreshing, error, markRead, onRefresh, refetch } =
    useNotifications();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading notifications…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Could not load notifications</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={() => { if (!item.is_read) markRead(item.id); }}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  errTitle:   { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  errSub:     { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  retryTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon:    { padding: 4 },
  headerTitle: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },
  badge: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2, minWidth: 22, alignItems: 'center',
  },
  badgeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: '#fff' },

  list: { padding: Spacing.md, paddingBottom: Spacing.xxxl, flexGrow: 1 },
  separator: { height: Spacing.xs },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardUnread: { borderColor: Colors.primary + '40', backgroundColor: '#F0FAF4' },
  iconWrap: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  body:    { flex: 1, gap: 4 },
  bodyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: {
    flex: 1, fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium, color: Colors.text,
    marginRight: Spacing.sm,
  },
  titleUnread: { fontWeight: Typography.weights.bold },
  time:    { fontSize: Typography.sizes.xs, color: Colors.textSecondary, flexShrink: 0 },
  message: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, lineHeight: 20 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, alignSelf: 'center', flexShrink: 0,
  },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, paddingTop: Spacing.xxxl,
  },
  emptyTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  emptySub:   {
    fontSize: Typography.sizes.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.xl,
  },
});
