import { describe, expect, it } from '@jest/globals';
import { getEasyViewMode, setEasyViewMode } from '../EasyViewManager';

describe('EasyViewManager (Easy View Mode) Suite', () => {
  it('reads and updates the global easy view mode state', () => {
    // Save current status
    const initialMode = getEasyViewMode();

    setEasyViewMode(true);
    expect(getEasyViewMode()).toBe(true);

    setEasyViewMode(false);
    expect(getEasyViewMode()).toBe(false);

    // Restore
    setEasyViewMode(initialMode);
  });
});
