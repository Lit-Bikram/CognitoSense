import React from 'react';
import { StyleSheet, TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#9ca3af"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
});