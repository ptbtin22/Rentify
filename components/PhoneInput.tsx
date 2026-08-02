// PhoneInput.tsx – reusable phone-number input with country-code picker.
// Mirrors the login page phone field exactly.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  CountryOption,
  sanitisePhoneInput
} from '../services/PhoneUtils';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChangePhone: (phone: string) => void;
  onChangeCountry: (code: string) => void;
}

export function PhoneInput({
  value,
  countryCode,
  onChangePhone,
  onChangeCountry
}: PhoneInputProps) {
  const [showMenu, setShowMenu] = useState(false);

  const selected = COUNTRY_OPTIONS.find(c => c.code === countryCode) ?? DEFAULT_COUNTRY;

  const handleChange = (text: string) => {
    onChangePhone(sanitisePhoneInput(text, countryCode));
  };

  const handleSelectCountry = (option: CountryOption) => {
    onChangeCountry(option.code);
    onChangePhone(''); // clear digits when switching
    setShowMenu(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Input row */}
      <View style={styles.inputBox}>
        {/* Country picker trigger */}
        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => setShowMenu(v => !v)}
        >
          <Text style={styles.countryText}>{selected.flag} {selected.code}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TextInput
          style={styles.textInput}
          placeholder={selected.placeholder}
          placeholderTextColor="#8E8E93"
          keyboardType="phone-pad"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setShowMenu(false)}
        />
      </View>

      {/* Dropdown menu — absolutely positioned so it overlays content below */}
      {showMenu && (
        <View style={styles.menu}>
          {COUNTRY_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.code}
              style={styles.menuItem}
              onPress={() => handleSelectCountry(option)}
            >
              <Text style={styles.menuText}>{option.flag} {option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8
  },
  countryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  arrow: {
    fontSize: 9,
    color: '#8E8E93'
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#C7C7CC',
    marginRight: 10
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E'
  },
  menu: {
    position: 'absolute',
    top: 54,   // inputBox height (50) + gap (4)
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999
  },
  menuItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7'
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  }
});
