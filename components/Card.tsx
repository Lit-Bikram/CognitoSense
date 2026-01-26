import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
    overflow: 'hidden',
  },
});