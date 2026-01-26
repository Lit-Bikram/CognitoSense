import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Import your existing games
import LaundrySorter from './laundry-sorter/LaundrySorter';
import MemoryDialer from './memory-dialer/MemoryDialer';
import MoneyManager from './money-manager/MoneyManager';
import ShoppingListRecall from './shopping-list-recall/ShoppingListRecall';

type GameKey = 'dialer' | 'shopping' | 'laundry' | 'money';
type TransitionType = 'slide_right' | 'slide_up' | 'scale_fade' | 'slide_left';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function GamesScreen() {
  const router = useRouter();
  const [currentGame, setCurrentGame] = useState<GameKey | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType>('scale_fade');

  const progress = useRef(new Animated.Value(0)).current;

  const openGame = useCallback((game: GameKey) => {
    if (isTransitioning || currentGame) return;

    const type: TransitionType =
      game === 'dialer'
        ? 'slide_right'
        : game === 'shopping'
          ? 'slide_up'
          : game === 'laundry'
            ? 'scale_fade'
            : 'slide_left';

    setTransitionType(type);
    setIsTransitioning(true);
    setCurrentGame(game);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      setIsTransitioning(false);
    });
  }, [currentGame, isTransitioning, progress]);

  const closeGame = useCallback(() => {
    if (isTransitioning || !currentGame) return;
    setIsTransitioning(true);
    Animated.timing(progress, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setCurrentGame(null);
      setIsTransitioning(false);
    });
  }, [currentGame, isTransitioning, progress]);

  const menuStyle = {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      transitionType === 'slide_right'
        ? { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_W * 0.08] }) }
        : transitionType === 'slide_left'
          ? { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_W * 0.08] }) }
          : transitionType === 'slide_up'
            ? { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_H * 0.04] }) }
            : { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) },
    ],
  };

  const gameStyle = {
    opacity: progress,
    transform: [
      transitionType === 'slide_right'
        ? { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_W, 0] }) }
        : transitionType === 'slide_left'
          ? { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, 0] }) }
          : transitionType === 'slide_up'
            ? { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H, 0] }) }
            : { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  const gameNode = currentGame === 'dialer' ? (
    <MemoryDialer onBack={closeGame} />
  ) : currentGame === 'shopping' ? (
    <ShoppingListRecall onBack={closeGame} />
  ) : currentGame === 'laundry' ? (
    <LaundrySorter onBack={closeGame} />
  ) : currentGame === 'money' ? (
    <MoneyManager onBack={closeGame} />
  ) : null;

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.screen, menuStyle]}
        pointerEvents={currentGame ? 'none' : 'auto'}
      >
        <ImageBackground
          source={{
            uri: 'https://wallpapers.com/images/hd/dark-green-background-opd5y4g4dx1cpfw6.jpg',
          }}
          resizeMode="cover"
          style={styles.bg}
        >
          <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.header}>CognitoSense</Text>
              <Text style={styles.subtitle}>
                Gamified cognitive activities for memory and attention
              </Text>

              <TouchableOpacity
                style={styles.card}
                onPress={() => openGame('dialer')}
                activeOpacity={0.85}
              >
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3059/3059446.png' }}
                    style={styles.icon}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Memory Dialer</Text>
                  <Text style={styles.cardDesc}>
                    Recall and dial number or word sequences to assess short-term memory
                    and attention span.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => openGame('shopping')}
                activeOpacity={0.85}
              >
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png' }}
                    style={styles.icon}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Shopping List Recall</Text>
                  <Text style={styles.cardDesc}>
                    Memorize and recall daily-use items to evaluate episodic memory
                    and real-life cognitive function.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => openGame('laundry')}
                activeOpacity={0.85}
              >
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2921/2921826.png' }}
                    style={styles.icon}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Laundry Sorter</Text>
                  <Text style={styles.cardDesc}>
                    Sort items by word or color to test cognitive flexibility
                    and reaction time.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => openGame('money')}
                activeOpacity={0.85}
              >
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' }}
                    style={styles.icon}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Money Manager</Text>
                  <Text style={styles.cardDesc}>
                    Decide what to buy within a budget to practice planning and
                    prioritisation skills.
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </ImageBackground>
      </Animated.View>

      <Animated.View
        style={[styles.screen, styles.gameScreen, gameStyle]}
        pointerEvents={currentGame ? 'auto' : 'none'}
      >
        {gameNode}
      </Animated.View>
    </View>
  );
}

const OLIVE_DARK = '#3E4E3A';
const OLIVE = '#6B8E23';
const OLIVE_LIGHT = '#E6F0D8';
const CARD_BG = 'rgba(255,255,255,0.95)';
const CREAM = '#FFF8EA';

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gameScreen: { backgroundColor: '#000' },
  bg: { flex: 1 },
  safe: { flex: 1 },
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  backButtonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    fontSize: 30,
    fontWeight: '800',
    color: CREAM,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: CREAM,
    marginBottom: 28,
    textAlign: 'center',
    maxWidth: 420,
  },
  card: {
    width: '94%',
    maxWidth: 720,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: OLIVE_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: OLIVE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: OLIVE,
  },
  icon: {
    width: 44,
    height: 44,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: OLIVE_DARK,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#4F5F3A',
    lineHeight: 18,
  },
});