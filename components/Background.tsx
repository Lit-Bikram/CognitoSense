import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const Background: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#0f172a', '#041025']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(107, 33, 168, 0.1)',
  },
});