import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftElement, rightElement, style, multiline, numberOfLines, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            focused && styles.focused,
            !!error && styles.hasError,
            multiline && { height: undefined, minHeight: 52 * (numberOfLines ?? 3), alignItems: 'flex-start', paddingVertical: Spacing.sm },
          ]}
        >
          {leftElement ? (
            <View style={styles.leftElement}>{leftElement}</View>
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.inputMultiline, style]}
            placeholderTextColor={Colors.secondary}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {rightElement ? (
            <View style={styles.rightElement}>{rightElement}</View>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  hasError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    padding: 0,
  },
  inputMultiline: {
    paddingTop: 2,
  },
  leftElement: {
    marginRight: Spacing.sm,
  },
  rightElement: {
    marginLeft: Spacing.sm,
  },
  error: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
  },
});
