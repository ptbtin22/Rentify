import { describe, expect, it } from '@jest/globals';
import { getElderlyMode, setElderlyMode } from '../AccessibilityManager';

describe('AccessibilityManager (Elderly Mode) Suite', () => {
  it('reads and updates the global elderly mode state', () => {
    // Save current status
    const initialMode = getElderlyMode();

    setElderlyMode(true);
    expect(getElderlyMode()).toBe(true);

    setElderlyMode(false);
    expect(getElderlyMode()).toBe(false);

    // Restore
    setElderlyMode(initialMode);
  });
});
