import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Background } from '../components/Background';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { t } = useLanguage();
  const router = useRouter();

  const handleRegister = () => {
    if (!username || !email || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    Alert.alert('Success', 'Account created!', [
      { text: 'OK', onPress: () => router.replace('/') }
    ]);
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
                label={t('username')}
                value={username}
                onChangeText={setUsername}
                placeholder="Your name"
              />

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

              <Input
                label={t('confirm')}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                placeholder="Repeat password"
              />

              <Button title={t('signup')} onPress={handleRegister} />

              <Text style={styles.helper}>
                {t('already_have')}{' '}
                <Text style={styles.link} onPress={() => router.replace('/')}>
                  {t('log_in')}
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