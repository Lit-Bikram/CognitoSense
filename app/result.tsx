import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useLanguage } from '../context/LanguageContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ResultScreen() {
  const { score: scoreParam, category } = useLocalSearchParams();
  const score = parseInt(scoreParam as string) || 0;
  const { t } = useLanguage();
  const router = useRouter();

  const animatedValue = useRef(new Animated.Value(0)).current;
  const animatedScore = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  const radius = 100;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Animate circle
    Animated.timing(animatedValue, {
      toValue: score / 100,
      duration: 1600,
      useNativeDriver: false,
    }).start();

    // Animate number count
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 1600,
      useNativeDriver: false,
    }).start();

    // Listen to animatedScore to update displayed number
    const id = animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    return () => {
      animatedScore.removeListener(id);
    };
  }, [score, animatedScore, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    // map 0 => full circumference, 1 => 0 so any animatedValue in between
    // will produce the correct offset when animatedValue reaches score/100
    outputRange: [circumference, 0],
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'risk_low': return '#059669';
      case 'risk_moderate': return '#d97706';
      case 'risk_high': return '#dc2626';
      case 'risk_very_high': return '#991b1b';
      default: return '#d97706';
    }
  };

  return (
    <View style={styles.container}>
      <Background />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{t('your_risk_is')}</Text>
          </View>

          <View style={styles.body}>
            {/* Circular Progress */}
            <View style={styles.circularWrap}>
              <Svg width={240} height={240} viewBox="0 0 240 240">
                <Defs>
                  <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#6b21a8" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                
                {/* Background Circle */}
                <Circle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="#d1d5db"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                
                {/* Progress Circle */}
                <AnimatedCircle
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke="url(#gradient)"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="120, 120"
                />
              </Svg>
              
              {/* Score Text */}
              <View style={styles.scoreOverlay}>
                <Text style={styles.scoreText}>{displayScore}%</Text>
              </View>
            </View>

            {/* Risk Category */}
            <Text style={[
              styles.category,
              { color: getCategoryColor(category as string) }
            ]}>
              {t(category as string)}
            </Text>

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimer}>{t('disclaimer')}</Text>
            </View>

            {/* Action Buttons */}
            <Button
              title="Take Various Tests for More Accurate Results"
              onPress={() => router.replace('/access')}
              style={styles.mainButton}
            />

            <Button
              title="Retake Assessment"
              onPress={() => router.replace('/questionnaire/1')}
              muted
              style={styles.secondaryButton}
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
  header: {
    padding: 28,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    padding: 32,
    paddingTop: 18,
    alignItems: 'center',
  },
  circularWrap: {
    position: 'relative',
    width: 240,
    height: 240,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -2,
  },
  category: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 28,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimerBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
    marginBottom: 28,
  },
  disclaimer: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
  },
  mainButton: {
    width: '100%',
    marginTop: 0,
    marginBottom: 12,
  },
  secondaryButton: {
    width: '100%',
    marginTop: 0,
  },
});