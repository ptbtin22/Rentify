//
//  contractAssets.ts — local demo photos for "Xem hợp đồng"
//

import type { ImageSourcePropType } from 'react-native';

const CONTRACT_PAGES: ImageSourcePropType[] = [
  require('../assets/contract-1.jpeg'),
  require('../assets/contract-2.jpeg'),
  require('../assets/contract-3.jpeg'),
  require('../assets/contract-4.jpeg'),
  require('../assets/contract-5.jpeg'),
  require('../assets/contract-6.jpeg'),
];

/** Image sources for `<Image source={...} />`. */
export const MOCK_CONTRACT_PHOTOS: ImageSourcePropType[] = CONTRACT_PAGES;

/** Resolved URI strings for seed data / ContractImageViewer. */
export function getMockContractPhotoUris(): string[] {
  try {
    const { Image } = require('react-native') as typeof import('react-native');
    return CONTRACT_PAGES.map((src) => {
      const resolved = Image.resolveAssetSource?.(src as number);
      return resolved?.uri ?? '';
    }).filter(Boolean);
  } catch {
    return CONTRACT_PAGES.map((_, i) => `asset:/contract-${i + 1}.jpeg`);
  }
}
