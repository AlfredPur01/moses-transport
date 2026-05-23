import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  searchable?: boolean;
}

export function Select({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  searchable = true,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.value === value);
  const filtered =
    searchable && query
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      : options;

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholderText]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.secondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchable ? (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={18}
                color={Colors.secondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={Colors.secondary}
                value={query}
                onChangeText={setQuery}
                autoFocus
              />
              {query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Options */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <TouchableOpacity
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={Colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  triggerError: {
    borderColor: Colors.error,
  },
  triggerText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.secondary,
  },
  error: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  optionSelected: {
    backgroundColor: Colors.cardGreen,
  },
  optionText: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
});
