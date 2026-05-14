import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

const DOT = 28;

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={index}>
            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCompleted && styles.dotCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={Colors.textLight}
                  />
                ) : (
                  <Text
                    style={[
                      styles.dotText,
                      (isActive || isCompleted) && styles.dotTextLight,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>

            {index < steps.length - 1 ? (
              <View
                style={[styles.line, isCompleted && styles.lineCompleted]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  step: {
    alignItems: 'center',
    gap: 5,
    width: 64,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dotCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dotText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.secondary,
  },
  dotTextLight: {
    color: Colors.textLight,
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.secondary,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  labelCompleted: {
    color: Colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginTop: DOT / 2 - 1,
  },
  lineCompleted: {
    backgroundColor: Colors.primary,
  },
});
