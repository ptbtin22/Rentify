//
//  onboarding.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../services/AuthManager';
import { useLanguage } from '../services/LanguageManager';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Slide {
  titleKey: string;
  descKey: string;
  color: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
}

const slides: Slide[] = [
  {
    titleKey: 'ob_title_1',
    descKey: 'ob_desc_1',
    color: '#007AFF', // Blue
    iconName: 'business'
  },
  {
    titleKey: 'ob_title_2',
    descKey: 'ob_desc_2',
    color: '#34C759', // Green
    iconName: 'notifications'
  },
  {
    titleKey: 'ob_title_3',
    descKey: 'ob_desc_3',
    color: '#FF3B30', // Red
    iconName: 'flame'
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { local } = useLanguage();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    completeOnboarding();
    router.replace('/login');
  };

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Row with Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.skipButton, { opacity: isLastSlide ? 0 : 1 }]}
          onPress={finishOnboarding}
          disabled={isLastSlide}
        >
          <Text style={styles.skipText}>{local('ob_skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Scroll Container */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slideContainer}>
            {/* Circle Visual Container */}
            <View style={[styles.iconCircle, { backgroundColor: slide.color + '1F' }]}>
              <Ionicons name={slide.iconName} size={70} color={slide.color} />
            </View>

            {/* Text details */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{local(slide.titleKey)}</Text>
              <Text style={styles.description}>{local(slide.descKey)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Indicators and Actions */}
      <View style={styles.footer}>
        {/* Page Dots Indicator */}
        <View style={styles.indicatorContainer}>
          {slides.map((slide, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp'
            });

            const dotColor = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: ['#E5E5EA', slide.color, '#E5E5EA'],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.indicator,
                  {
                    width: dotWidth,
                    backgroundColor: dotColor
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? local('ob_start') : local('ob_next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'space-between'
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 10
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  skipText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  slideContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  textContainer: {
    alignItems: 'center',
    gap: 12
  },
  title: {
    color: '#1C1C1E',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4
  },
  description: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center'
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8
  },
  indicator: {
    height: 8,
    borderRadius: 4
  },
  indicatorActive: {
    width: 24
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: '#E5E5EA'
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  }
});
