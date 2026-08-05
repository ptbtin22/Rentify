//
//  tenants.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Linking,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, Tenant, Lease, Payment } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { useRouter } from 'expo-router';
import { PhoneInput } from '../../components/PhoneInput';
import { validatePhone } from '../../services/PhoneUtils';
import { formatVND } from '../../services/CurrencyUtils';
import { formatDisplayDate } from '../../services/dateUtils';
import { getInitials } from '../../services/nameUtils';
import { excludeFuturePayments } from '../../services/paymentUtils';
import { verifyCodeForPhone } from '../../services/TenantInviteCode';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

const phoneDigits = (raw: string) =>
  raw.replace(/\D/g, '').replace(/^84/, '').replace(/^0/, '');

export default function LandlordTenants() {
  const { local, localF, language } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Modals
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Credentials presentation states
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; phone: string; password?: string } | null>(null);
  const [isCredentialsModalVisible, setIsCredentialsModalVisible] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [zalo, setZalo] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const refreshData = () => {
    setTenants([...Database.getTenants()]);
    setLeases([...Database.getLeases()]);
    setProperties([...Database.getProperties()]);
    setPayments([...Database.getPayments()]);
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(refreshData);
    refreshData();
    return unsubscribe;
  }, []);

  const resetAddForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCountryCode('+84');
    setNotes('');
    setPhotoUri(undefined);
    setZalo('');
    setInviteCodeInput('');
  };

  const phoneIsValid = validatePhone(phone, countryCode) === null;
  const codeIsValid = /^\d{4}$/.test(inviteCodeInput.trim());
  const canSubmit = !!name.trim() && phoneIsValid && codeIsValid;

  const handleSave = () => {
    if (!name.trim()) return;
    if (!phoneIsValid) return;

    const fullPhone = countryCode + phone;
    const fullZalo = zalo ? countryCode + zalo : undefined;
    const matchDigits = phoneDigits(fullPhone);

    // Demo: any 4-digit code is accepted, but it must pair with a valid phone number.
    if (!verifyCodeForPhone(fullPhone, inviteCodeInput)) {
      Alert.alert(local('tenant_code_invalid'));
      return;
    }

    const existing = tenants.find(t => phoneDigits(t.phone) === matchDigits);

    if (existing) {
      Database.updateTenant(existing.id, {
        name,
        email,
        phone: fullPhone,
        notes,
        photoUri,
        zalo: fullZalo
      });
      resetAddForm();
      setIsAddVisible(false);
      return;
    }

    const tempPassword = 'RT-' + Math.floor(1000 + Math.random() * 9000);
    Database.addTenant({
      name,
      email,
      phone: fullPhone,
      notes,
      password: tempPassword,
      photoUri,
      zalo: fullZalo
    });

    setCreatedCredentials({ name, phone: fullPhone, password: tempPassword });
    setIsCredentialsModalVisible(true);

    resetAddForm();
    setIsAddVisible(false);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(local('permission_required'), local('permission_library'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      local('delete_tenant_title'),
      local('delete_tenant_desc'),
      [
        { text: local('cancel'), style: 'cancel' },
        {
          text: local('delete'),
          style: 'destructive',
          onPress: () => {
            Database.deleteTenant(id);
            setSelectedTenant(null);
          }
        }
      ]
    );
  };

  // Get leases history for a tenant
  const getTenantLeases = (tenantId: string) => {
    return leases
      .filter(l => l.tenantId === tenantId)
      .map(l => {
        const prop = properties.find(p => p.id === l.propertyId);
        return {
          ...l,
          propertyName: prop ? prop.name : 'Unknown Property'
        };
      });
  };

  const getTenantPaymentHistory = (tenantId: string) => {
    const tenantLeaseIds = leases.filter(l => l.tenantId === tenantId).map(l => l.id);
    return excludeFuturePayments(payments.filter(p => tenantLeaseIds.includes(p.leaseId)))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>{local('tenants')}</Text>
        <TouchableOpacity onPress={() => { resetAddForm(); setIsAddVisible(true); }}>
          <Text style={[styles.addText, { fontSize: adjustSize(14) }]}>➕ {local('add_tenant')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tenants List */}
      <FlatList
        data={tenants}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={[styles.emptyTitle, { fontSize: adjustSize(16) }]}>{local('no_tenants')}</Text>
            <Text style={[styles.emptyDesc, { fontSize: adjustSize(13) }]}>{local('add_first_tenant')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const activeLeases = leases.filter(l => l.tenantId === item.id && l.status === 'active');
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedTenant(item)}>
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.cardAvatar} />
              ) : (
                <View style={[styles.cardAvatar, styles.avatarPlaceholder]}>
                  <Text style={[styles.cardAvatarInitials, { fontSize: adjustSize(16) }]}>
                    {getInitials(item.name)}
                  </Text>
                </View>
              )}

              <View style={styles.details}>
                <Text style={[styles.name, { fontSize: adjustSize(15) }]}>{item.name}</Text>
                <Text style={[styles.email, { fontSize: adjustSize(13) }]}>{item.email}</Text>
              </View>

              <View style={styles.values}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: activeLeases.length > 0 ? '#34C75926' : '#8E8E9326' }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: activeLeases.length > 0 ? '#34C759' : '#8E8E93', fontSize: adjustSize(11) }
                    ]}
                  >
                    {activeLeases.length > 0 ? local('leasing') : local('inactive')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Add Tenant Modal */}
      <Modal visible={isAddVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{local('add_tenant')}</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSubmit}
                style={!canSubmit && { opacity: 0.5 }}
              >
                <Text style={styles.modalSave}>{local('save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('contact_info')}</Text>
              
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(14) }]}
                  placeholder={local('name')}
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(14) }]}
                  placeholder={local('email_optional')}
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <PhoneInput
                value={phone}
                countryCode={countryCode}
                onChangePhone={setPhone}
                onChangeCountry={setCountryCode}
              />

              <View style={[styles.inputBox, { marginTop: 12 }]}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(14) }]}
                  placeholder={local('zalo_number')}
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                  value={zalo}
                  onChangeText={setZalo}
                />
              </View>

              <TouchableOpacity
                style={styles.copyFromPhoneBtn}
                onPress={() => setZalo(phone)}
              >
                <Text style={[styles.copyFromPhoneBtnText, { fontSize: adjustSize(13) }]}>{local('copy_from_phone')}</Text>
              </TouchableOpacity>

              <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('enter_tenant_code')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(14), letterSpacing: 4 }]}
                  placeholder="1234"
                  placeholderTextColor="#8E8E93"
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={phoneIsValid}
                  value={inviteCodeInput}
                  onChangeText={(v) => setInviteCodeInput(v.replace(/\D/g, ''))}
                />
              </View>
              <Text style={[styles.helperText, { fontSize: adjustSize(12) }]}>
                {phoneIsValid ? local('tenant_code_hint') : local('tenant_code_needs_phone')}
              </Text>

              <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('tenant_photo')}</Text>
              <View style={styles.photoRow}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarPreview} />
                ) : (
                  <View style={[styles.avatarPreview, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarPlaceholderIcon}>👤</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.choosePhotoBtn} onPress={handlePickPhoto}>
                  <Text style={[styles.choosePhotoBtnText, { fontSize: adjustSize(13) }]}>{local('choose_photo_action')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('notes')}</Text>
              <View style={styles.notesBox}>
                <TextInput
                  style={[styles.notesInput, { fontSize: adjustSize(14) }]}
                  placeholder={local('add_notes_placeholder')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tenant Detail Modal */}
      <Modal visible={selectedTenant !== null} animationType="slide" transparent>
        {selectedTenant && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedTenant(null)}>
                  <Text style={styles.modalCancel}>{local('close')}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedTenant.name}</Text>
                <View style={{ width: 50 }} />
              </View>

              <ScrollView style={styles.formScroll}>
                <View style={styles.avatarDetailWrap}>
                  {selectedTenant.photoUri ? (
                    <Image source={{ uri: selectedTenant.photoUri }} style={styles.avatarDetail} />
                  ) : (
                    <View style={[styles.avatarDetail, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderIconLarge}>👤</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('contact_details')}</Text>
                <View style={styles.detailContainer}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('name')}</Text>
                    <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>{selectedTenant.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('email_label')}</Text>
                    <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>{selectedTenant.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('phone_label')}</Text>
                    <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>{selectedTenant.phone || 'N/A'}</Text>
                  </View>
                  {selectedTenant.zalo ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('zalo_number')}</Text>
                      <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>{selectedTenant.zalo}</Text>
                    </View>
                  ) : null}
                  {(selectedTenant.zalo || selectedTenant.phone) ? (
                    <TouchableOpacity
                      style={styles.zaloBtn}
                      onPress={() => {
                        const target = selectedTenant.zalo || selectedTenant.phone;
                        const cleanPhone = target.replace(/[^0-9]/g, '');
                        Linking.openURL(`https://zalo.me/${cleanPhone}`);
                      }}
                    >
                      <Text style={[styles.zaloBtnText, { fontSize: adjustSize(13) }]}>{local('chat_on_zalo')}</Text>
                    </TouchableOpacity>
                  ) : null}
                  {selectedTenant.notes ? (
                    <View style={styles.notesDetails}>
                      <Text style={[styles.notesTitle, { fontSize: adjustSize(13) }]}>{local('notes')}</Text>
                      <Text style={[styles.notesBody, { fontSize: adjustSize(13) }]}>{selectedTenant.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Leases List */}
                <Text style={[styles.label, { fontSize: adjustSize(12) }]}>{local('leases')}</Text>
                {getTenantLeases(selectedTenant.id).length === 0 ? (
                  <View style={styles.emptyLease}>
                    <Text style={[styles.emptyLeaseText, { fontSize: adjustSize(13) }]}>{local('no_active_leases')}</Text>
                  </View>
                ) : (
                  <View style={styles.leaseContainer}>
                    {getTenantLeases(selectedTenant.id).map(lease => (
                      <View key={lease.id} style={styles.leaseRow}>
                        <Text style={styles.leasePropName}>{lease.propertyName}</Text>
                        <Text style={styles.leaseDates}>
                          {formatDisplayDate(lease.startDate)} – {formatDisplayDate(lease.endDate)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: '#007AFF1A', marginBottom: 12 }]}
                  onPress={() => {
                    const tid = selectedTenant.id;
                    setSelectedTenant(null);
                    router.push({
                      pathname: '/(landlord)/create-lease',
                      params: { tenantId: tid }
                    });
                  }}
                >
                  <Text style={[styles.deleteBtnText, { color: '#007AFF' }]}>🔑 {local('create_lease_title')}</Text>
                </TouchableOpacity>

                {/* Payment History Section */}
                <Text style={[styles.label, { fontSize: adjustSize(12), marginTop: 8 }]}>{local('payment_history')}</Text>
                {(() => {
                  const hist = getTenantPaymentHistory(selectedTenant.id);
                  if (hist.length === 0) {
                    return (
                      <View style={styles.emptyLease}>
                        <Text style={[styles.emptyLeaseText, { fontSize: adjustSize(13) }]}>{local('no_payment_history')}</Text>
                      </View>
                    );
                  }
                  let lastM = '';
                  return (
                    <View style={styles.leaseContainer}>
                      {hist.map((p, idx) => {
                        const d = new Date(p.dueDate);
                        const mk = `${d.getFullYear()}-${d.getMonth()}`;
                        const showDiv = mk !== lastM;
                        if (showDiv) lastM = mk;
                        const mLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
                        const lease = leases.find(l => l.id === p.leaseId);
                        const prop = lease ? properties.find(pr => pr.id === lease.propertyId) : null;
                        const isPaid = p.status === 'Paid';
                        return (
                          <React.Fragment key={`hist-frag-${p.id}`}>
                            {showDiv && (
                              <View key={`div-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 6 }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                                <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase' }}>{mLabel}</Text>
                                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                              </View>
                            )}
                            <View key={p.id} style={[styles.leaseRow, { justifyContent: 'space-between' }]}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.leasePropName, { fontSize: adjustSize(13) }]}>{prop?.name || 'Phòng'}</Text>
                                <Text style={[styles.leaseDates, { fontSize: adjustSize(11) }]}>{local('due_label')} {formatDisplayDate(p.dueDate)}</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: adjustSize(13), fontWeight: '700' }}>{formatVND(p.amount)}</Text>
                                <Text style={{ fontSize: 11, color: isPaid ? '#34C759' : '#FF9500', fontWeight: '600' }}>
                                  {isPaid ? local('filter_paid') : local('filter_pending')}
                                </Text>
                              </View>
                            </View>
                          </React.Fragment>
                        );
                      })}
                    </View>
                  );
                })()}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedTenant.id)}
                >
                  <Text style={styles.deleteBtnText}>{local('delete')} {local('tenant') || 'Tenant'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>

      {/* Credentials Success Modal */}
      <Modal
        visible={isCredentialsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCredentialsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>{local('tenant_created_title')}</Text>
            <Text style={styles.successDesc}>
              {local('share_credentials_desc')}
            </Text>
            
            <View style={styles.credentialsCard}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>{local('credential_name_label')}</Text>
                <Text style={styles.credentialValue}>{createdCredentials?.name}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>{local('credential_phone_label')}</Text>
                <Text style={styles.credentialValue}>{createdCredentials?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>{local('credential_password_label')}</Text>
                <Text style={[styles.credentialValue, styles.tempPasswordText]}>
                  {createdCredentials?.password}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={async () => {
                await Clipboard.setStringAsync(
                  localF('credentials_clipboard_text', {
                    phone: createdCredentials?.phone || '',
                    password: createdCredentials?.password || ''
                  })
                );
                Alert.alert(local('copied_title'), local('credentials_copied_desc'));
              }}
            >
              <Text style={styles.copyButtonText}>{local('copy_credentials_action')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successCloseBtn}
              onPress={() => setIsCredentialsModalVisible(false)}
            >
              <Text style={styles.successCloseBtnText}>{local('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  addText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center'
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#5856D61A'
  },
  cardAvatarInitials: {
    fontWeight: '800',
    color: '#5856D6'
  },
  details: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  email: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2
  },
  values: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    height: '90%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
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
    color: '#8E8E93',
    fontWeight: '500'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  modalSave: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700'
  },
  formScroll: {
    padding: 16
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16
  },
  inputBox: {
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12
  },
  textInput: {
    fontSize: 15,
    color: '#1C1C1E'
  },
  notesBox: {
    minHeight: 100,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E'
  },
  helperText: {
    color: '#8E8E93',
    marginTop: -6,
    marginBottom: 12,
    paddingHorizontal: 4
  },
  copyFromPhoneBtn: {
    height: 40,
    backgroundColor: '#007AFF1A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  copyFromPhoneBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700'
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  avatarPlaceholder: {
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarPlaceholderIcon: {
    fontSize: 28
  },
  avatarPlaceholderIconLarge: {
    fontSize: 40
  },
  choosePhotoBtn: {
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF1A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  choosePhotoBtnText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '700'
  },
  avatarDetailWrap: {
    alignItems: 'center',
    marginBottom: 8
  },
  avatarDetail: {
    width: 88,
    height: 88,
    borderRadius: 44
  },
  detailContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600'
  },
  notesDetails: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 10
  },
  notesTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  notesBody: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20
  },
  emptyLease: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  emptyLeaseText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600'
  },
  leaseContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 12,
    gap: 8
  },
  leaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  leasePropName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  leaseDates: {
    fontSize: 12,
    color: '#8E8E93'
  },
  deleteBtn: {
    height: 52,
    backgroundColor: '#FF3B301A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20
  },
  deleteBtnText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '700'
  },
  zaloBtn: {
    height: 48,
    backgroundColor: '#007AFF1A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#007AFF4D'
  },
  zaloBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700'
  },
  successModalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 34, // Safe area padding for notches
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center'
  },
  successDesc: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  credentialsCard: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 20
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  credentialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93'
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  tempPasswordText: {
    color: '#FF9500',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  copyButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  copyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  successCloseBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successCloseBtnText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
