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

  const renderMockup = (index: number) => {
    switch (index) {
      case 0:
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupTitle}>Khu Oakridge (Complex)</Text>
              <Text style={styles.mockupSub}>12 Rooms • 88% Occupied</Text>
            </View>
            <View style={styles.mockupItem}>
              <Text style={styles.mockupItemText}>🚪 Phòng 202 (Room 202)</Text>
              <Text style={styles.mockupItemStatusGreen}>Active Lease</Text>
            </View>
            <View style={styles.mockupItem}>
              <Text style={styles.mockupItemText}>🚪 Phòng 104 (Room 104)</Text>
              <Text style={styles.mockupItemStatusGreen}>Active Lease</Text>
            </View>
            <View style={styles.mockupItem}>
              <Text style={styles.mockupItemText}>🚪 Phòng 301 (Room 301)</Text>
              <Text style={styles.mockupItemStatusOrange}>Vacant</Text>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupTitle}>Hóa Đơn Tháng 10 (Invoices)</Text>
              <Text style={styles.mockupSub}>Phòng 202 • Jane Tenant</Text>
            </View>
            <View style={styles.mockupRow}>
              <Text style={styles.mockupRowLabel}>Tiền phòng (Room Rent):</Text>
              <Text style={styles.mockupRowVal}>$1,200</Text>
            </View>
            <View style={styles.mockupRow}>
              <Text style={styles.mockupRowLabel}>Chỉ số điện (235 kWh):</Text>
              <Text style={styles.mockupRowVal}>$32.90</Text>
            </View>
            <View style={styles.mockupDivider} />
            <View style={styles.mockupRowTotal}>
              <Text style={styles.mockupTotalLabel}>Tổng cộng (Total):</Text>
              <Text style={styles.mockupTotalVal}>$1,238.90</Text>
            </View>
            <View style={styles.mockupQrBadge}>
              <Text style={styles.mockupQrText}>📲 Quét VietQR / MoMo Pay</Text>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={[styles.mockupContainer, { borderColor: '#FF3B30', backgroundColor: '#FF3B300A' }]}>
            <View style={styles.mockupHeader}>
              <Text style={[styles.mockupTitle, { color: '#FF3B30' }]}>⚠️ BÁO CHÁY KHẨN CẤP</Text>
              <Text style={[styles.mockupSub, { color: '#FF3B30' }]}>Hệ thống loa warning + haptics</Text>
            </View>
            <View style={styles.mockupAlertBox}>
              <Text style={styles.mockupAlertText}>
                🚨 CẢNH BÁO: KHU TRỌ CÓ CHÁY! VUI LÒNG DI TẢN!
              </Text>
            </View>
            <View style={styles.mockupIndicatorRow}>
              <View style={styles.mockupIndicatorCircle}>
                <Text style={styles.mockupIndicatorCount}>5 TAPS</Text>
              </View>
              <Text style={styles.mockupIndicatorLabel}>Nhấn 5 lần để kích hoạt</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
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
            {/* Circle Visual Container with Icon */}
            <View style={[styles.iconCircle, { backgroundColor: slide.color + '10' }]}>
              <Ionicons name={slide.iconName} size={54} color={slide.color} />
            </View>

            {/* Simulated Live UI Mockups (Wow factor) */}
            {renderMockup(index)}

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
    marginBottom: 16
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
  // Onboarding UI Mockups
  mockupContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    padding: 16,
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3
  },
  mockupHeader: {
    marginBottom: 12
  },
  mockupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  mockupSub: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2
  },
  mockupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    alignItems: 'center'
  },
  mockupItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  mockupItemStatusGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34C759',
    backgroundColor: '#34C7591A',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  mockupItemStatusOrange: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    backgroundColor: '#FF95001A',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  mockupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  mockupRowLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600'
  },
  mockupRowVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  mockupDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 6
  },
  mockupRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  mockupTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  mockupTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34C759'
  },
  mockupQrBadge: {
    alignItems: 'center',
    backgroundColor: '#34C7591A',
    borderRadius: 8,
    paddingVertical: 6
  },
  mockupQrText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34C759'
  },
  mockupAlertBox: {
    backgroundColor: '#FF3B301A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12
  },
  mockupAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 16
  },
  mockupIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  mockupIndicatorCircle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mockupIndicatorCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900'
  },
  mockupIndicatorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30'
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
