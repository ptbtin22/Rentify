//
//  login.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, Role } from '../services/AuthManager';
import { useLanguage } from '../services/LanguageManager';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { local, language, setLanguage } = useLanguage();

  // Form State
  const [role, setRole] = useState<Role>('landlord');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Focus States for Border Animations
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);

  // Theme Colors
  const themeColor = role === 'landlord' ? '#007AFF' : '#34C759'; // Blue vs Green
  const logoGradient = role === 'landlord' ? ['#007AFF', '#5856D6'] : ['#34C759', '#30B0C7'];

  // Phone Validation
  const getPhoneLimit = (code: string) => {
    if (code === '+84') return 9; // VN
    if (code === '+1') return 10; // US
    return 8; // SG (+65)
  };

  const handlePhoneChange = (text: string) => {
    let filtered = text.replace(/[^0-9]/g, '');
    if (countryCode === '+84' && filtered.startsWith('0')) {
      filtered = filtered.substring(1);
    }
    const limit = getPhoneLimit(countryCode);
    if (filtered.length > limit) {
      filtered = filtered.substring(0, limit);
    }
    setPhoneNumber(filtered);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setErrorMessage(null);

    // Validation
    if (!phoneNumber) {
      setErrorMessage(local('err_phone_empty'));
      return;
    }

    const limit = getPhoneLimit(countryCode);
    if (phoneNumber.length !== limit) {
      if (countryCode === '+84') setErrorMessage(local('err_phone_digits_vi'));
      else if (countryCode === '+1') setErrorMessage(local('err_phone_digits_us'));
      else setErrorMessage(local('err_phone_digits_sg'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(local('err_password_short'));
      return;
    }

    setIsLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      setIsLoading(false);
      login(role);
      router.replace(role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/portal');
    }, 1000);
  };

  const handleQuickLogin = (selectedRole: Role) => {
    login(selectedRole);
    router.replace(selectedRole === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/portal');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Custom Header Bar with Language Picker */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.langSelector} onPress={toggleLanguage}>
              <Text style={styles.langText}>
                {language === 'en' ? '🇺🇸 EN' : '🇻🇳 VI'}  🌐
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={[styles.logo, { backgroundColor: themeColor }]}>
                <Text style={styles.logoLetter}>R</Text>
              </View>
              <Text style={styles.logoText}>Rentify</Text>
              <Text style={styles.logoSubtitle}>{local('subtitle')}</Text>
            </View>

            {/* Segmented Role Picker */}
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  role === 'landlord' && { backgroundColor: '#FFF' }
                ]}
                onPress={() => setRole('landlord')}
              >
                <Text style={[styles.pickerText, role === 'landlord' && styles.pickerTextActive]}>
                  🏠 {local('landlord')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  role === 'tenant' && { backgroundColor: '#FFF' }
                ]}
                onPress={() => setRole('tenant')}
              >
                <Text style={[styles.pickerText, role === 'tenant' && styles.pickerTextActive]}>
                  👤 {local('tenant')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Form Fields */}
            <View style={styles.formContainer}>
              {/* Phone Field */}
              <View
                style={[
                  styles.inputCard,
                  focusedField === 'phone' && { borderColor: themeColor, borderWidth: 1.5 }
                ]}
              >
                <Text style={styles.inputIcon}>📞</Text>
                
                {/* Country Code Dropdown Trigger */}
                <TouchableOpacity
                  style={styles.countryDropdown}
                  onPress={() => setShowCountryMenu(!showCountryMenu)}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TextInput
                  style={styles.textInput}
                  placeholder={
                    countryCode === '+84' ? '901234567' :
                    countryCode === '+1' ? '5551234567' : '81234567'
                  }
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  onFocus={() => {
                    setFocusedField('phone');
                    setShowCountryMenu(false);
                  }}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Country Selection Menu Dropdown */}
              {showCountryMenu && (
                <View style={styles.countryMenu}>
                  <TouchableOpacity
                    style={styles.countryMenuItem}
                    onPress={() => {
                      setCountryCode('+84');
                      setShowCountryMenu(false);
                      setPhoneNumber('');
                    }}
                  >
                    <Text style={styles.countryMenuText}>🇻🇳 VN (+84)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.countryMenuItem}
                    onPress={() => {
                      setCountryCode('+1');
                      setShowCountryMenu(false);
                      setPhoneNumber('');
                    }}
                  >
                    <Text style={styles.countryMenuText}>🇺🇸 US (+1)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.countryMenuItem}
                    onPress={() => {
                      setCountryCode('+65');
                      setShowCountryMenu(false);
                      setPhoneNumber('');
                    }}
                  >
                    <Text style={styles.countryMenuText}>🇸🇬 SG (+65)</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Password Field */}
              <View
                style={[
                  styles.inputCard,
                  focusedField === 'password' && { borderColor: themeColor, borderWidth: 1.5 }
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={local('password')}
                  placeholderTextColor="#8E8E93"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => {
                    setFocusedField('password');
                    setShowCountryMenu(false);
                  }}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Error Message */}
              {errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
              )}
            </View>

            {/* Action Buttons Section */}
            <View style={styles.actionContainer}>
              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: themeColor }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{local('log_in')}</Text>
                )}
              </TouchableOpacity>

              {/* Quick Login Divider */}
              <View style={styles.quickLoginDividerRow}>
                <View style={styles.line} />
                <Text style={styles.quickLoginDividerText}>{local('quick_login')}</Text>
                <View style={styles.line} />
              </View>

              {/* Quick Login Buttons */}
              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={() => handleQuickLogin('landlord')}
              >
                <Text style={styles.quickLoginText}>
                  🏠 {local('log_in_as')}{' '}
                  <Text style={{ fontWeight: '700' }}>{local('landlord')}</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickLoginButton}
                onPress={() => handleQuickLogin('tenant')}
              >
                <Text style={styles.quickLoginText}>
                  👤 {local('log_in_as')}{' '}
                  <Text style={{ fontWeight: '700' }}>{local('tenant')}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// React Native Fallback for safe areas if Platform is not imported
const SafeAreaViewComponent = SafeAreaView;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  keyboardContainer: {
    flex: 1
  },
  header: {
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  langSelector: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 16
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF'
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 36
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4
  },
  logoLetter: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900'
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginTop: 16
  },
  logoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 6
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 2,
    marginBottom: 36
  },
  pickerButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93'
  },
  pickerTextActive: {
    color: '#1C1C1E'
  },
  formContainer: {
    marginBottom: 36
  },
  inputCard: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 16
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 4
  },
  dropdownArrow: {
    fontSize: 8,
    color: '#8E8E93'
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#C7C7CC',
    marginRight: 12
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500'
  },
  countryMenu: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 8,
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  countryMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  countryMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  actionContainer: {
    gap: 12
  },
  submitButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  quickLoginDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA'
  },
  quickLoginDividerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1,
    marginHorizontal: 8
  },
  quickLoginButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickLoginText: {
    fontSize: 14,
    color: '#1C1C1E'
  }
});
