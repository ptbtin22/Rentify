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
  TouchableWithoutFeedback,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, Role, AuthManager } from '../services/AuthManager';
import { useLanguage } from '../services/LanguageManager';
import { LinearGradient } from 'expo-linear-gradient';
import { getPhoneLimit, sanitisePhoneInput, validatePhone } from '../services/PhoneUtils';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { local, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  // Form State
  const [role, setRole] = useState<Role>('landlord');
  
  // Reset Password States (Q9)
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<'phone' | 'otp'>('phone');
  const [resetPhone, setResetPhone] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSendResetOtp = () => {
    setResetError(null);
    if (!resetPhone.trim()) {
      setResetError(language === 'vi' ? 'Vui lòng nhập số điện thoại.' : 'Please enter your phone number.');
      return;
    }
    
    // Normalize phone number and verify
    const normalized = resetPhone.replace(/[^0-9]/g, '');
    const isLandlord = normalized.endsWith('901234567');
    const isTenant = normalized.endsWith('909888777');
    
    if (!isLandlord && !isTenant) {
      setResetError(local('err_phone_not_registered'));
      return;
    }
    
    setResetStep('otp');
    Alert.alert(
      language === 'vi' ? 'Đã gửi mã xác thực' : 'OTP Code Sent',
      local('otp_message').replace('{phone}', resetPhone)
    );
  };

  const handleConfirmResetPassword = () => {
    setResetError(null);
    if (!resetOtp.trim() || !resetNewPass.trim() || !resetConfirmPass.trim()) {
      setResetError(language === 'vi' ? 'Vui lòng nhập đầy đủ thông tin.' : 'Please fill in all fields.');
      return;
    }
    if (resetOtp !== '888888') {
      setResetError(local('err_invalid_otp'));
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError(local('err_password_mismatch'));
      return;
    }
    if (resetNewPass.length < 6) {
      setResetError(local('err_password_too_short'));
      return;
    }

    const res = AuthManager.resetPasswordByPhone(resetPhone, resetNewPass);
    if (!res.success) {
      setResetError(local(res.error || 'err_phone_not_registered'));
      return;
    }

    Alert.alert(
      language === 'vi' ? 'Thành công' : 'Success',
      local('reset_success')
    );
    setIsResetModalVisible(false);
    setResetPhone('');
    setResetOtp('');
    setResetNewPass('');
    setResetConfirmPass('');
  };
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

  // Phone Validation — rules live in services/PhoneUtils.ts
  const handlePhoneChange = (text: string) => {
    setPhoneNumber(sanitisePhoneInput(text, countryCode));
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

    const phoneError = validatePhone(phoneNumber, countryCode);
    if (phoneError) {
      setErrorMessage(local(phoneError));
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
      const isCorrect = AuthManager.verifyPassword(role, password, phoneNumber);
      if (!isCorrect) {
        setErrorMessage(local('err_incorrect_password'));
        return;
      }
      login(role);
      router.replace(role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/portal');
    }, 1000);
  };

  const handleQuickLogin = (selectedRole: Role) => {
    login(selectedRole);
    router.replace(selectedRole === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/portal');
  };

  return (
    <View style={{ flex: 1 }}>
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
              <Image
                source={require('../assets/rentify_logo.png')}
                style={styles.logoImage}
              />
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

              {/* Forgot Password Link Button (Q9) */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => {
                  setResetPhone(phoneNumber); // prefill from phone input
                  setResetStep('phone');
                  setResetError(null);
                  setIsResetModalVisible(true);
                }}
              >
                <Text style={[styles.forgotText, { color: themeColor }]}>{local('forgot_password')}</Text>
              </TouchableOpacity>

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

    {/* ─── Reset Password Modal Overlay (Q9) ─── */}
    <Modal
      visible={isResetModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setIsResetModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsResetModalVisible(false)}>
              <Text style={styles.modalCancel}>{local('close')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{local('reset_password')}</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalForm}>
            {resetStep === 'phone' ? (
              <View style={styles.resetStepContainer}>
                <Text style={styles.resetInstruction}>
                  {language === 'vi' 
                    ? 'Nhập số điện thoại đã đăng ký để nhận mã khôi phục mật khẩu.' 
                    : 'Enter your registered phone number to receive a recovery code.'}
                </Text>
                
                <View style={styles.inputCard}>
                  <Text style={styles.inputIcon}>📞</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={language === 'vi' ? 'Số điện thoại' : 'Phone number'}
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={resetPhone}
                    onChangeText={setResetPhone}
                  />
                </View>

                {resetError && <Text style={styles.resetErrorText}>{resetError}</Text>}

                <TouchableOpacity style={[styles.resetSubmitBtn, { backgroundColor: themeColor }]} onPress={handleSendResetOtp}>
                  <Text style={styles.resetSubmitBtnText}>{local('send_otp')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resetStepContainer}>
                <Text style={styles.resetInstruction}>
                  {local('otp_message').replace('{phone}', resetPhone)}
                </Text>

                <Text style={styles.inputLabel}>{local('enter_otp')}</Text>
                <TextInput
                  style={styles.resetInput}
                  placeholder="888888"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                  value={resetOtp}
                  onChangeText={setResetOtp}
                  maxLength={6}
                />

                <Text style={styles.inputLabel}>{local('new_password')}</Text>
                <TextInput
                  style={styles.resetInput}
                  secureTextEntry
                  value={resetNewPass}
                  onChangeText={setResetNewPass}
                  placeholder="••••••"
                  placeholderTextColor="#8E8E93"
                />

                <Text style={styles.inputLabel}>{local('confirm_new_password')}</Text>
                <TextInput
                  style={styles.resetInput}
                  secureTextEntry
                  value={resetConfirmPass}
                  onChangeText={setResetConfirmPass}
                  placeholder="••••••"
                  placeholderTextColor="#8E8E93"
                />

                {resetError && <Text style={styles.resetErrorText}>{resetError}</Text>}

                <TouchableOpacity style={[styles.resetSubmitBtn, { backgroundColor: themeColor }]} onPress={handleConfirmResetPassword}>
                  <Text style={styles.resetSubmitBtnText}>{local('confirm_reset')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>
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
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
    resizeMode: 'contain'
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
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700'
  },
  // Reset password modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%'
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  modalTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: '#1C1C1E'
  },
  modalForm: {
    padding: 16
  },
  resetStepContainer: {
    gap: 12
  },
  resetInstruction: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4
  },
  resetInput: {
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1C1C1E'
  },
  resetSubmitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  resetSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  resetErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  }
});
