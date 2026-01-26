import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AccessScreen() {
  const { t } = useLanguage();
  const { username } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Background />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>Welcome back, {username}!</Text>
          <Text style={styles.subtitleText}>
            Take additional tests for more accurate results
          </Text>
        </View>

        {/* Eye Tracking Card */}
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👁️</Text>
            </View>
            <Text style={styles.cardTitle}>{t('eye_track')}</Text>
            <Text style={styles.cardDescription}>
              Advanced eye tracking analysis to detect cognitive patterns and early signs of dementia
            </Text>
            <Button
              title="Start Eye Test"
              onPress={() => router.push('/eye-test')}
              style={styles.cardButton}
            />
          </View>
        </Card>

        {/* Cognitive Games Card */}
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🎮</Text>
            </View>
            <Text style={styles.cardTitle}>{t('play_games')}</Text>
            <Text style={styles.cardDescription}>
              Engage in cognitive games designed to improve memory, attention, and cognitive skills
            </Text>
            <Button
              title="Play Games"
              onPress={() => router.push('/games/games')}
              style={styles.cardButton}
            />
          </View>
        </Card>

        {/* Retake Assessment Card */}
        <Card style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>Questionnaire</Text>
            <Text style={styles.cardDescription}>
              Retake the comprehensive assessment questionnaire
            </Text>
            <Button
              title="Retake Assessment"
              onPress={() => router.push('/questionnaire/1')}
              muted
              style={styles.cardButton}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",      // ✅ center horizontally
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 650,          // ✅ controls card width
    alignSelf: "center",
  },
  headerSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  card: {
    marginBottom: 18,
  },
  cardContent: {
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(107, 33, 168, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  cardButton: {
    width: '100%',
    marginTop: 8,
  },
});