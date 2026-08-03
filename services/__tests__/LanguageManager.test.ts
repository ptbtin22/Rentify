import { describe, expect, it } from '@jest/globals';
import { getLanguage, setLanguage, translations } from '../LanguageManager';

describe('LanguageManager Service Suite', () => {
  it('allows reading and updating global language state', () => {
    const initialLang = getLanguage();
    expect(['en', 'vi']).toContain(initialLang);

    setLanguage('vi');
    expect(getLanguage()).toBe('vi');

    setLanguage('en');
    expect(getLanguage()).toBe('en');

    // Restore original state
    setLanguage(initialLang);
  });

  it('translates core UI keys correctly', () => {
    // Check landlord key translation
    expect(translations['landlord']['en']).toBe('Landlord');
    expect(translations['landlord']['vi']).toBe('Chủ nhà');

    // Check tenant key translation
    expect(translations['tenant']['en']).toBe('Tenant');
    expect(translations['tenant']['vi']).toBe('Người thuê');
  });
});
