//
//  FireAlertManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { Vibration, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { getLanguage } from './LanguageManager';

// Vibration pattern: [delay, vibrate, delay, vibrate...]
// For a continuous alarm feel: 500ms silent, 1000ms vibrate
const VIBRATION_PATTERN = [500, 1000];

class FireAlertManager {
  private isAlerting = false;
  private speechInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(active: boolean) => void> = new Set();

  subscribe(listener: (active: boolean) => void) {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.isAlerting);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.isAlerting));
  }

  isActive() {
    return this.isAlerting;
  }

  async startEmergencySiren() {
    if (this.isAlerting) return;
    this.isAlerting = true;
    this.notify();

    // Start repeating vibration
    Vibration.vibrate(VIBRATION_PATTERN, true);

    // Start looping text-to-speech
    this.playSpeechWarning();
    this.speechInterval = setInterval(() => {
      this.playSpeechWarning();
    }, 5000);
  }

  stopEmergencySiren() {
    if (!this.isAlerting) return;
    this.isAlerting = false;
    this.notify();

    // Stop vibration
    Vibration.cancel();

    // Stop text-to-speech loop
    if (this.speechInterval) {
      clearInterval(this.speechInterval);
      this.speechInterval = null;
    }
    Speech.stop();
  }

  private playSpeechWarning() {
    if (!this.isAlerting) return;

    const currentLang = getLanguage();
    const speakText = currentLang === 'vi'
      ? 'CẢNH BÁO: KHU TRỌ CÓ CHÁY! VUI LÒNG DI TẢN KHẨN CẤP!'
      : 'WARNING: FIRE DETECTED! PLEASE EVACUATE THE BUILDING IMMEDIATELY!';

    Speech.speak(speakText, {
      language: currentLang === 'vi' ? 'vi-VN' : 'en-US',
      pitch: 1.0,
      rate: Platform.OS === 'ios' ? 0.95 : 0.85,
    });
  }
}

export const FireAlertNotifier = new FireAlertManager();
export { FireAlertManager };
