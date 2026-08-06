// jest.setup.js — global mock configuration for React Native and Expo SDK modules using CommonJS

global.jest = global.jest || {};

jest.mock('react-native', () => ({
  Vibration: {
    vibrate: jest.fn(),
    cancel: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(objs => objs.ios),
  },
  Image: {
    resolveAssetSource: jest.fn(() => ({ uri: 'mock://dong-ho-dien.jpeg' })),
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));
