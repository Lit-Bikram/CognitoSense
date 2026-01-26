import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface RadioButtonProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export const RadioButton: React.FC<RadioButtonProps> = ({ label, value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.option, value === true && styles.optionSelected]}
          onPress={() => onChange(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, value === true && styles.radioSelected]}>
            {value === true && <View style={styles.radioInner} />}
          </View>
          <Text style={[styles.optionText, value === true && styles.optionTextSelected]}>
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, value === false && styles.optionSelected]}
          onPress={() => onChange(false)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, value === false && styles.radioSelected]}>
            {value === false && <View style={styles.radioInner} />}
          </View>
          <Text style={[styles.optionText, value === false && styles.optionTextSelected]}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 10,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.02)',
    gap: 10,
    flex: 1,
  },
  optionSelected: {
    backgroundColor: 'rgba(107, 33, 168, 0.08)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#6b21a8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6b21a8',
  },
  optionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#6b21a8',
    fontWeight: '600',
  },
});