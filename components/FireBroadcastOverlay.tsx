//
//  FireBroadcastOverlay.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { NoticeRepository } from '../services/NoticeRepository';
import { FireAlertNotifier } from '../services/FireAlertManager';
import { useLanguage } from '../services/LanguageManager';

const { width } = Dimensions.get('window');

export function FireBroadcastOverlay() {
  const { local } = useLanguage();
  const [activeAlert, setActiveAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  // Track the ID of the fire notice we've already triggered on
  const lastFiredId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = NoticeRepository.subscribe((notices) => {
      // Find the latest fire notice in the list
      const latestFire = notices.find(n => n.type === 'fire');
      
      if (latestFire) {
        // If this is a brand new fire notice we haven't acted on yet
        if (latestFire.id !== lastFiredId.current) {
          lastFiredId.current = latestFire.id;
          setAlertText(latestFire.body);
          setActiveAlert(true);
          // Start the vibration loop and looping voice siren warning
          FireAlertNotifier.startEmergencySiren();
        }
      }
    });

    return unsubscribe;
  }, []);

  // Set up repeating high-intensity warning color flash (red to deep red)
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (activeAlert) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false })
        ])
      );
      loop.start();
    } else {
      flashAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [activeAlert]);

  const handleDismiss = () => {
    setActiveAlert(false);
    FireAlertNotifier.stopEmergencySiren();
  };

  if (!activeAlert) return null;

  // Interpolate flashing background color
  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF3B30', '#8B0000']
  });

  return (
    <Animated.View style={[styles.fullscreenContainer, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={styles.sirenIcon}>🚨</Text>
        <Text style={styles.alertHeader}>{local('emergency_fire_alert')}</Text>
        
        <View style={styles.textContainer}>
          <Text style={styles.alertBody}>{alertText}</Text>
        </View>

        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>{local('cancel').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sirenIcon: {
    fontSize: 72,
    marginBottom: 20
  },
  alertHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  alertBody: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28
  },
  dismissButton: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  dismissText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5
  }
});
