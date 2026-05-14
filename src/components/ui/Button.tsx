import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import { BorderRadius, Colors, Typography } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  title,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.textLight : Colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost' && styles.labelGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: Colors.textLight,
  },
  labelOutline: {
    color: Colors.primary,
  },
  labelGhost: {
    color: Colors.primary,
  },
});
