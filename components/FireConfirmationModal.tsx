//
//  FireConfirmationModal.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration
} from 'react-native';
import { useLanguage } from '../services/LanguageManager';

interface FireConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FireConfirmationModal({ visible, onClose, onConfirm }: FireConfirmationModalProps) {
  const { local } = useLanguage();
  const [tapCount, setTapCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Reset count when modal becomes visible or invisible
  useEffect(() => {
    if (visible) {
      setTapCount(0);
    }
  }, [visible]);

  const handleTap = () => {
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    // Dynamic haptic confirmation feedback on tap
    Vibration.vibrate(80);

    // Rapid pop animation on click
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0, tension: 150, friction: 8, useNativeDriver: true })
    ]).start();

    if (nextCount >= 5) {
      // Small delay to let the user see "5/5" and feel the confirmation
      setTimeout(() => {
        onConfirm();
        onClose();
      }, 300);
    }
  };

  const currentPercent = (tapCount / 5) * 100;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header warning */}
          <Text style={styles.title}>{local('confirm_fire_alert')}</Text>
          <Text style={styles.desc}>{local('fire_tap_warning')}</Text>
          <Text style={styles.subDesc}>{local('fire_tap_instruction')}</Text>

          {/* Core Interactive Circle */}
          <View style={styles.circleOuter}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTap}
                style={[
                  styles.circleButton,
                  { backgroundColor: tapCount >= 5 ? '#34C759' : '#FF3B30' }
                ]}
              >
                <Text style={styles.fireEmoji}>🔥</Text>
                <Text style={styles.tapText}>
                  {tapCount >= 5
                    ? local('fire_tap_activate')
                    : local('fire_tap_count').replace('{count}', tapCount.toString())}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Circular Fill Track overlay */}
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressBar, { width: `${currentPercent}%` }]} />
            </View>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{local('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF3B304D'
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8
  },
  desc: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD60A',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 16
  },
  subDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8
  },
  circleOuter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  circleButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  fireEmoji: {
    fontSize: 48,
    marginBottom: 4
  },
  tapText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center'
  },
  progressBarWrapper: {
    position: 'absolute',
    bottom: -10,
    width: 180,
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 3
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    width: '100%',
    alignItems: 'center'
  },
  cancelText: {
    color: '#AEAEB2',
    fontSize: 15,
    fontWeight: '700'
  }
});
