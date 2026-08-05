import { describe, expect, it, afterEach } from '@jest/globals';
import { translations, setLanguage, getLanguage, localF } from '../LanguageManager';

describe('LanguageManager VI UX', () => {
  afterEach(() => setLanguage('en'));

  it('unpaid_balance Vietnamese is Số tiền chưa thu', () => {
    expect(translations.unpaid_balance.vi).toBe('Số tiền chưa thu');
  });

  it('localF replaces placeholders', () => {
    setLanguage('vi');
    expect(localF('contract_page_indicator', { current: 2, total: 3 })).toBe('Trang 2/3');
  });

  it('new feature keys exist in both en and vi', () => {
    const required = [
      'unpaid_balance',
      'add_menu_room',
      'add_menu_complex',
      'room_info',
      'occupant_section',
      'price_details',
      'base_rent_label',
      'electricity_rate_label',
      'water_rate_optional',
      'service_fee_optional',
      'parking_fee_optional',
      'add_custom_fee',
      'zalo_number',
      'copy_from_phone',
      'tenant_photo',
      'update_contract_photos',
      'contract_last_updated',
      'contract_page_indicator',
      'no_occupant',
      'call_action',
      'email_action',
      'landlord_tab_dashboard',
      'landlord_tab_properties',
      'landlord_tab_tenants',
      'landlord_tab_payments',
      'landlord_tab_notices',
    ];
    for (const key of required) {
      expect(translations[key]?.en).toBeTruthy();
      expect(translations[key]?.vi).toBeTruthy();
    }
  });
});
