import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f172a' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Login' }} />
          <Stack.Screen name="register" options={{ title: 'Register' }} />
          <Stack.Screen name="questionnaire/[section]" options={{ title: 'Assessment' }} />
          <Stack.Screen name="result" options={{ title: 'Results' }} />
          <Stack.Screen name="access" options={{ title: 'Tests' }} />
          <Stack.Screen name="games" options={{ title: 'Games' }} />
          <Stack.Screen name="eye-test" options={{ title: 'Eye Test' }} />
          <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}