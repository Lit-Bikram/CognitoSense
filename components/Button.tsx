import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  muted?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  style, 
  muted,
  disabled 
}) => {
  if (muted) {
    return (
      <TouchableOpacity 
        style={[styles.mutedButton, style]} 
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.mutedText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#6b21a8', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  mutedButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(107, 33, 168, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  mutedText: {
    color: '#6b21a8',
    fontWeight: '700',
    fontSize: 15,
  },
});