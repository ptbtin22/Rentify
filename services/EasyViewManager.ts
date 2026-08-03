//
//  EasyViewManager.ts
//  Rentify
//
//  Created by Tin Pham on 31/7/26.
//

import { useState, useEffect } from 'react';
import { Vibration } from 'react-native';

let globalEasyViewMode = false;
const listeners = new Set<(mode: boolean) => void>();

export const getEasyViewMode = (): boolean => globalEasyViewMode;

export const setEasyViewMode = (mode: boolean) => {
  globalEasyViewMode = mode;
  Vibration.vibrate(50);
  listeners.forEach(listener => listener(mode));
};

export const useEasyViewMode = () => {
  const [isEasyView, setIsEasyView] = useState(globalEasyViewMode);

  useEffect(() => {
    listeners.add(setIsEasyView);
    return () => {
      listeners.delete(setIsEasyView);
    };
  }, []);

  // FontSize adjuster helper
  const adjustSize = (baseSize: number): number => {
    return isEasyView ? Math.round(baseSize * 1.35) : baseSize;
  };

  return {
    isEasyView,
    setEasyViewMode,
    adjustSize
  };
};
