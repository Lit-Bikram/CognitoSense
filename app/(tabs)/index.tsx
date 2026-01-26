import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Background } from '../../components/Background';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    login(email.split('@')[0]);
    // After login, redirect users to the assessment start page
    router.replace('/questionnaire/1');
  };

  return (
    <View style={styles.container}>
      <Background />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>{t('title')}</Text>
              <Text style={styles.subtitle}>{t('welcome')}</Text>
            </View>

            <View style={styles.body}>
              <Input
                label={t('email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />

              <Input
                label={t('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />

              <Button title={t('signin')} onPress={handleLogin} />

              <Text style={styles.helper}>
                New here?{' '}
                <Text
                  style={styles.link}
                  onPress={() => router.push('/register')}
                >
                  Create an account
                </Text>
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    padding: 28,
    paddingBottom: 6,
  },
  title: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 13,
  },
  body: {
    padding: 32,
    paddingTop: 18,
    paddingBottom: 28,
  },
  helper: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
  },
  link: {
    color: '#6b21a8',
    fontWeight: '600',
  },
});