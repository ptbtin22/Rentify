//
//  SettingsModal.tsx
//  Rentify
//

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as RNView, Platform } from 'react-native';
import { useAuth, AuthManager } from '../services/AuthManager';
import { TextInput } from 'react-native';
import { useLanguage } from '../services/LanguageManager';
import { useEasyViewMode } from '../services/EasyViewManager';
import { Database } from '../services/Database';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { currentRole } = useAuth();
  const { local, language, setLanguage } = useLanguage();
  const { isEasyView, setEasyViewMode, adjustSize } = useEasyViewMode();
  const insets = useSafeAreaInsets();
  const [fireSoundEnabled, setFireSoundEnabled] = React.useState(Database.isFireSoundEnabled());

  // Password change states (Q9)
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);

  const handleSavePassword = () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError(local('please_fill_all_fields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(local('err_password_mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(local('err_password_too_short'));
      return;
    }

    const res = AuthManager.changePassword(currentRole, oldPassword, newPassword);
    if (!res.success) {
      setPasswordError(local(res.error || 'err_incorrect_password'));
      return;
    }

    setPasswordSuccess(local('password_changed_success'));
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess(null);
    }, 1500);
  };

  const themeColor = currentRole === 'landlord' ? '#007AFF' : '#34C759';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <RNView style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 12 : Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>{local('close')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: adjustSize(17) }]}>{local('settings')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          {/* Section 1: Accessibility */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>{local('accessibility_settings')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.label, { fontSize: adjustSize(14) }]}>{local('easy_view_mode')}</Text>
              </View>
              <Switch
                value={isEasyView}
                onValueChange={setEasyViewMode}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor={isEasyView ? '#FFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Section 1.5: Emergency sound options */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>{local('notification_settings') || 'PREFERENCES'}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.label, { fontSize: adjustSize(14) }]}>
                  {language === 'vi' ? 'Âm báo báo cháy (Siren)' : 'Fire Alarm Siren Sound'}
                </Text>
              </View>
              <Switch
                value={fireSoundEnabled}
                onValueChange={(val) => {
                  setFireSoundEnabled(val);
                  Database.setFireSoundEnabled(val);
                }}
                trackColor={{ false: '#767577', true: '#FF3B30' }}
                thumbColor={fireSoundEnabled ? '#FFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Section 2: Languages */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>{local('language')}</Text>
          <View style={styles.card}>
            <View style={styles.langContainer}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'en' && { backgroundColor: themeColor, borderColor: themeColor }
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnText, language === 'en' && { color: '#FFF' }, { fontSize: adjustSize(13) }]}>
                  🇺🇸 English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'vi' && { backgroundColor: themeColor, borderColor: themeColor }
                ]}
                onPress={() => setLanguage('vi')}
              >
                <Text style={[styles.langBtnText, language === 'vi' && { color: '#FFF' }, { fontSize: adjustSize(13) }]}>
                  🇻🇳 Tiếng Việt
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Change Password Section (Q9) ─── */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>{local('change_password').toUpperCase()}</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.togglePasswordBtn} 
              onPress={() => setIsChangingPassword(!isChangingPassword)}
            >
              <Text style={[styles.togglePasswordBtnText, { color: themeColor, fontSize: adjustSize(14) }]}>
                {isChangingPassword ? `✕ ${local('cancel_change_password')}` : `🔐 ${local('proceed_change_password')}`}
              </Text>
            </TouchableOpacity>

            {isChangingPassword && (
              <View style={styles.passwordForm}>
                <Text style={[styles.inputLabel, { fontSize: adjustSize(12) }]}>{local('current_password')}</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="••••••"
                  placeholderTextColor="#8E8E93"
                />

                <Text style={[styles.inputLabel, { fontSize: adjustSize(12) }]}>{local('new_password')}</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••"
                  placeholderTextColor="#8E8E93"
                />

                <Text style={[styles.inputLabel, { fontSize: adjustSize(12) }]}>{local('confirm_new_password')}</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••"
                  placeholderTextColor="#8E8E93"
                />

                {passwordError && (
                  <Text style={styles.errorText}>{passwordError}</Text>
                )}

                {passwordSuccess && (
                  <Text style={styles.successText}>{passwordSuccess}</Text>
                )}

                <TouchableOpacity style={[styles.submitPasswordBtn, { backgroundColor: themeColor }]} onPress={handleSavePassword}>
                  <Text style={styles.submitPasswordBtnText}>{local('save')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  title: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  content: {
    padding: 16,
    gap: 16
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontWeight: '700',
    color: '#1C1C1E'
  },
  langContainer: {
    flexDirection: 'row',
    gap: 12
  },
  langBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },
  langBtnText: {
    fontWeight: '700',
    color: '#8E8E93'
  },
  togglePasswordBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  togglePasswordBtnText: {
    fontWeight: '700'
  },
  passwordForm: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
    gap: 10
  },
  inputLabel: {
    fontWeight: '600',
    color: '#8E8E93'
  },
  passwordInput: {
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1C1C1E'
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  submitPasswordBtn: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  submitPasswordBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
