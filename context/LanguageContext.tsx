import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'es' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    title: 'Dementia Predictor',
    welcome: 'Welcome',
    email: 'Email',
    password: 'Password',
    signin: 'Sign in',
    signup: 'Create account',
    username: 'Username',
    confirm: 'Confirm Password',
    language: 'Language',
    submit: 'Submit responses',
    next: 'Next',
    back: 'Back',
    yes: 'Yes',
    no: 'No',
    your_risk_is: 'Your Risk Score',
    risk_low: 'Low Risk',
    risk_moderate: 'Moderate Risk',
    risk_high: 'High Risk',
    risk_very_high: 'Very High Risk',
    disclaimer: 'This is a preliminary assessment. Please consult a healthcare professional for accurate diagnosis.',
    eye_track: 'Eye Tracking',
    play_games: 'Play Games',
    contact_doctor: 'Please consult with a healthcare professional for proper evaluation.',
  },
  es: {
    title: 'Predictor de Demencia',
    welcome: 'Bienvenido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signin: 'Iniciar sesión',
    signup: 'Crear cuenta',
    // Add more Spanish translations
  },
  // Add other languages as needed
};

interface LanguageContextType {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[currentLang]?.[key] || key;
  };

  const setLanguage = (lang: Language) => {
    setCurrentLang(lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};