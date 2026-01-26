import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Background } from '../../components/Background';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { RadioButton } from '../../components/RadioButton';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';



type SectionType = 'numeric' | 'yesno' | 'mixed';

const SECTIONS = {
  1: {
    title: 'SECTION 1 — BASIC RISK FACTORS',
    type: 'mixed' as SectionType,
    fields: [
      { key: 'name', label: 'What is your name?' },
      { key: 'age', label: 'What is your age?' },
      { key: 'sleep_hours', label: 'How many hours of sleep do you get per night on average?' },
      { key: 'exercise_days', label: 'How many days per week do you exercise (at least 30 minutes)?' },
      { key: 'family_dementia', label: 'How many close family members (parents/grandparents) had dementia?' },
      { key: 'long_term_diseases', label: 'How many long-term diseases do you have? (e.g., diabetes, hypertension)' },
      { key: 'medications_daily', label: 'How many medications do you take daily?' },
      { key: 'forgotten_times', label: 'How many times in the last month have you forgotten appointments or tasks?' },
      { key: 'falls_past_year', label: 'How many falls or balance-related incidents have you had in the past year?' },
    ],
  },
  2: {
    title: 'SECTION 2 — LIFESTYLE & HEALTH RISKS',
    type: 'yesno' as SectionType,
    fields: [
      { key: 'smoke', label: 'Do you smoke?' },
      { key: 'drink', label: 'Do you drink alcohol regularly (at least once per week)?' },
      { key: 'diabetes', label: 'Do you have diabetes?' },
      { key: 'high_bp', label: 'Do you have high blood pressure?' },
      { key: 'high_cholesterol', label: 'Do you have high cholesterol?' },
      { key: 'history_stroke', label: 'Do you have a history of stroke?' },
    ],
  },
  3: {
    title: 'SECTION 3 — COGNITIVE EARLY SIGNS',
    type: 'yesno' as SectionType,
    fields: [
      { key: 'forget_recent', label: 'Do you often forget recent conversations or events?' },
      { key: 'misplace_objects', label: 'Do you frequently misplace objects (keys, phone, wallet)?' },
      { key: 'confused_dates', label: 'Do you get confused about dates or time of day?' },
      { key: 'trouble_instructions', label: 'Do you have trouble following instructions or familiar tasks (e.g., cooking)?' },
      { key: 'difficult_concentrate', label: 'Do you find it difficult to concentrate for long periods?' },
      { key: 'word_finding', label: 'Do you struggle to find the right words while speaking?' },
      { key: 'get_lost', label: 'Do you get lost in familiar places?' },
    ],
  },
  4: {
    title: 'SECTION 4 — BEHAVIOURAL / MOOD CHANGES',
    type: 'yesno' as SectionType,
    fields: [
      { key: 'mood_changes', label: 'Have you experienced sudden mood changes recently?' },
      { key: 'feel_irritable', label: 'Have you felt unusually irritable, confused, or anxious?' },
      { key: 'others_noticed_change', label: 'Have others noticed a change in your personality or behaviour?' },
    ],
  },
  5: {
    title: 'SECTION 5 — DAILY FUNCTIONAL ABILITY',
    type: 'yesno' as SectionType,

    fields: [
      { key: 'need_help_daily', label: 'Do you need help with daily tasks (shopping, bills, medicines)?' },
      { key: 'forget_meals_meds', label: 'Do you forget to eat meals or take medicine on time?' },
      { key: 'struggle_money', label: 'Do you struggle to manage money or simple calculations?' },
    ],
  },
};

const globalAnswers: Record<string, any> = {};

export default function QuestionnaireScreen() {
  const { section } = useLocalSearchParams();
  const sectionNum = parseInt(section as string);
  const { t } = useLanguage();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { username, isAuthenticated } = useAuth();
  const currentSection = SECTIONS[sectionNum as keyof typeof SECTIONS];
  const progress = ((sectionNum - 1) / 4) * 100;
  
  useEffect(() => {
    const sectionAnswers: Record<string, any> = {};
    currentSection.fields.forEach(field => {
      if (globalAnswers[field.key] !== undefined) {
        sectionAnswers[field.key] = globalAnswers[field.key];
      }
    });
    setAnswers(sectionAnswers);
  }, [sectionNum, currentSection.fields]);
  
  const isValidName = (name: string) => {
    // Only alphabets and spaces allowed
    return /^[A-Za-z\s]+$/.test(name.trim());
  };
  const validateSection = () => {
    for (const field of currentSection.fields) {
      const answer = answers[field.key];

      // ✅ NAME validation
      if (field.key === "name") {
        if (!answer || answer.trim() === "") {
          return "Please enter your name.";
        }
        if (!/^[A-Za-z\s]+$/.test(answer.trim())) {
          return "Name must contain only alphabets (no numbers or symbols).";
        }
        continue;
      }

      // ✅ Numeric fields
      if (currentSection.type === "numeric" || currentSection.type === "mixed") {
        if (answer === undefined || answer === "") {
          return `Please fill the field: ${field.label}`;
        }
        continue;
      }

      // ✅ Yes/No fields
      if (answer === null || answer === undefined) {
        return `Please answer: ${field.label}`;
      }
    }

    return null; // ✅ no error
  };

  const handleNext = async () => {
    console.log("AUTH STATE:", { isAuthenticated, username });

    const error = validateSection();

    // ✅ SHOW POPUP
    if (error) {
      Alert.alert("⚠️ Invalid Input", error);
      return;
    }

    // ✅ Save answers globally
    Object.keys(answers).forEach(key => {
      globalAnswers[key] = answers[key];
    });

    // ✅ Go to next section
    if (sectionNum < 5) {
      router.push(`/questionnaire/${sectionNum + 1}`);
      return;
    }

    // ✅ Last section logic
    if (!isAuthenticated || !username) {
      Alert.alert("Not logged in", "Please log in before submitting the questionnaire.");
      return;
    }

    setLoading(true);

    try {
      const score = calculateRiskScore(globalAnswers);
      const category = getRiskCategory(score);
      const questionnaireResponse = buildQuestionnaireResponse(globalAnswers);

      const payload = {
        userId: username,
        email: `${username}@cognitosense.local`,
        name: globalAnswers.name?.trim() || "",
        questionnaireResponse,
        totalScore: score,
        targetClass:
          category === "risk_low" ? 0 :
          category === "risk_moderate" ? 1 :
          category === "risk_high" ? 2 : 3,
      };

      console.log("📤 Sending questionnaire payload:", payload);

      const res = await fetch("http://192.168.1.4:4000/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("API failed");

      console.log("✅ Questionnaire saved successfully");

      router.replace({
        pathname: "/result",
        params: { score: score.toString(), category },
      });

    } catch (err) {
      console.error("❌ Questionnaire submit failed:", err);
      Alert.alert("Error", "Failed to submit questionnaire. Check backend.");
    } finally {
      setLoading(false);
    }
  };





  const handleBack = () => {
    Object.keys(answers).forEach(key => {
      globalAnswers[key] = answers[key];
    });
    router.back();
  };

  const updateAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <Background />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{t('title')}</Text>
            <Text style={styles.sectionNumber}>Section {sectionNum} of 5</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.progressWrap}>
              <View style={[styles.progress, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.sectionTitle}>{currentSection.title}</Text>

            {currentSection.type === 'numeric' || currentSection.type === 'mixed'
            ? currentSection.fields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  value={answers[field.key]?.toString() || ''}
                  onChangeText={(val) => updateAnswer(field.key, val)}
                  keyboardType={field.key === 'name' ? 'default' : 'numeric'} // ✅ FIX
                  placeholder={field.key === 'name' ? 'Enter your name' : '0'}
                />
              ))
            : currentSection.fields.map((field) => (
                <RadioButton
                  key={field.key}
                  label={field.label}
                  value={answers[field.key]}
                  onChange={(val) => updateAnswer(field.key, val)}
                />
              ))}


            <View style={styles.buttons}>
              {sectionNum > 1 && (
                <Button title={t('back')} onPress={handleBack} style={{ flex: 1 }} muted />
              )}
              <Button
                title={sectionNum === 5 ? t('submit') : t('next')}
                onPress={handleNext}
                // onPress={() => {
                //   console.log("SUBMIT BUTTON PRESSED");
                // }}
                style={{ flex: 1 }}
                disabled={loading}
              />
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

// ✅ BUILD NESTED QUESTIONNAIRE SET
function buildQuestionnaireResponse(allAnswers: Record<string, any>) {
  return {
    section_1: {
      age: Number(allAnswers.age),
      sleep_hours: Number(allAnswers.sleep_hours),
      exercise_days: Number(allAnswers.exercise_days),
      family_dementia: Number(allAnswers.family_dementia),
      long_term_diseases: Number(allAnswers.long_term_diseases),
      medications_daily: Number(allAnswers.medications_daily),
      forgotten_times: Number(allAnswers.forgotten_times),
      falls_past_year: Number(allAnswers.falls_past_year),
    },
    section_2: {
      smoke: !!allAnswers.smoke,
      drink: !!allAnswers.drink,
      diabetes: !!allAnswers.diabetes,
      high_bp: !!allAnswers.high_bp,
      high_cholesterol: !!allAnswers.high_cholesterol,
      history_stroke: !!allAnswers.history_stroke,
    },
    section_3: {
      forget_recent: !!allAnswers.forget_recent,
      misplace_objects: !!allAnswers.misplace_objects,
      confused_dates: !!allAnswers.confused_dates,
      trouble_instructions: !!allAnswers.trouble_instructions,
      difficult_concentrate: !!allAnswers.difficult_concentrate,
      word_finding: !!allAnswers.word_finding,
      get_lost: !!allAnswers.get_lost,
    },
    section_4: {
      mood_changes: !!allAnswers.mood_changes,
      feel_irritable: !!allAnswers.feel_irritable,
      others_noticed_change: !!allAnswers.others_noticed_change,
    },
    section_5: {
      need_help_daily: !!allAnswers.need_help_daily,
      forget_meals_meds: !!allAnswers.forget_meals_meds,
      struggle_money: !!allAnswers.struggle_money,
    },
  };
}

// Risk calculation algorithm
function calculateRiskScore(answers: Record<string, any>): number {
  let raw = 0;

  // Section 1: Basic Risk Factors (numeric weights)
  const age = parseInt(answers.age) || 0;
  if (age > 65) raw += 15;
  else if (age > 50) raw += 10;
  else if (age > 35) raw += 5;

  const sleepHoursRaw = parseFloat(answers.sleep_hours);
  const sleepHours = Number.isNaN(sleepHoursRaw) ? 7 : sleepHoursRaw;
  if (sleepHours < 6) raw += 10;
  else if (sleepHours < 7) raw += 5;

  const exerciseDays = Math.min(7, Math.max(0, parseInt(answers.exercise_days) || 0));
  if (exerciseDays < 2) raw += 10;
  else if (exerciseDays < 4) raw += 5;

  const familyDementia = Math.min(2, Math.max(0, parseInt(answers.family_dementia) || 0));
  raw += familyDementia * 8;

  const longTermDiseases = Math.min(3, Math.max(0, parseInt(answers.long_term_diseases) || 0));
  raw += longTermDiseases * 5;

  const medicationsDaily = Math.min(10, Math.max(0, parseInt(answers.medications_daily) || 0));
  raw += medicationsDaily * 3;

  const forgottenTimes = Math.min(10, Math.max(0, parseInt(answers.forgotten_times) || 0));
  raw += forgottenTimes * 2;

  const fallsPastYear = Math.min(5, Math.max(0, parseInt(answers.falls_past_year) || 0));
  raw += fallsPastYear * 4;

  // Section 2: Lifestyle & Health Risks
  if (answers.smoke === true) raw += 8;
  if (answers.drink === true) raw += 5;
  if (answers.diabetes === true) raw += 10;
  if (answers.high_bp === true) raw += 8;
  if (answers.high_cholesterol === true) raw += 6;
  if (answers.history_stroke === true) raw += 15;

  // Section 3: Cognitive Early Signs
  if (answers.forget_recent === true) raw += 10;
  if (answers.misplace_objects === true) raw += 8;
  if (answers.confused_dates === true) raw += 10;
  if (answers.trouble_instructions === true) raw += 12;
  if (answers.difficult_concentrate === true) raw += 8;
  if (answers.word_finding === true) raw += 10;
  if (answers.get_lost === true) raw += 15;

  // Section 4: Behavioural / Mood Changes
  if (answers.mood_changes === true) raw += 8;
  if (answers.feel_irritable === true) raw += 8;
  if (answers.others_noticed_change === true) raw += 12;

  // Section 5: Daily Functional Ability
  if (answers.need_help_daily === true) raw += 15;
  if (answers.forget_meals_meds === true) raw += 12;
  if (answers.struggle_money === true) raw += 10;

  // Compute maximum possible raw score based on the same per-field caps so we can normalize
  const maxRaw =
    15 + // age
    10 + // sleep
    10 + // exercise
    2 * 8 + // familyDementia
    3 * 5 + // longTermDiseases
    10 * 3 + // medicationsDaily
    10 * 2 + // forgottenTimes
    5 * 4 + // fallsPastYear
    (8 + 5 + 10 + 8 + 6 + 15) + // section 2 sum
    (10 + 8 + 10 + 12 + 8 + 10 + 15) + // section 3 sum
    (8 + 8 + 12) + // section 4 sum
    (15 + 12 + 10); // section 5 sum

  // Normalize to 0-100 based on the theoretical maximum
  const normalized = Math.round((raw / maxRaw) * 100);

  // Ensure result is within bounds
  return Math.min(Math.max(normalized, 0), 100);
}

function getRiskCategory(score: number): string {
  if (score < 25) return 'risk_low';
  if (score < 50) return 'risk_moderate';
  if (score < 75) return 'risk_high';
  return 'risk_very_high';
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
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '700',
  },
  sectionNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
  body: {
    padding: 32,
    paddingTop: 18,
  },
  progressWrap: {
    height: 8,
    backgroundColor: 'rgba(11, 17, 32, 0.06)',
    borderRadius: 999,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#06b6d4',
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});