//
//  AccessibilityManager.ts
//  Rentify
//
//  Created by Tin Pham on 31/7/26.
//

import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';

let globalElderlyMode = false;
const listeners = new Set<(mode: boolean) => void>();

export const getElderlyMode = (): boolean => globalElderlyMode;

export const setElderlyMode = (mode: boolean) => {
  globalElderlyMode = mode;
  Vibration.vibrate(50);
  listeners.forEach(listener => listener(mode));
};

export const useElderlyMode = () => {
  const [isElderly, setIsElderly] = useState(globalElderlyMode);

  useEffect(() => {
    listeners.add(setIsElderly);
    return () => {
      listeners.delete(setIsElderly);
    };
  }, []);

  // FontSize adjuster helper
  const adjustSize = (baseSize: number): number => {
    return isElderly ? Math.round(baseSize * 1.35) : baseSize;
  };

  return {
    isElderly,
    setElderlyMode,
    adjustSize
  };
};
