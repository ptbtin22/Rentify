//
//  portal.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActionSheetIOS,
  Platform,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
  Vibration,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { Database, Property, Lease, Payment } from '../../services/Database';
import { useElderlyMode } from '../../services/AccessibilityManager';
import { useLanguage } from '../../services/LanguageManager';
import { ProfileModal } from '../../components/ProfileModal';
import { SettingsModal } from '../../components/SettingsModal';
import { PostDetailModal } from '../../components/PostDetailModal';
import { Notice } from '../../services/NoticeRepository';

export default function TenantPortal() {
  const { local, language } = useLanguage();
  const router = useRouter();
  const { logout } = useAuth();

  const [activeLease, setActiveLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([]);
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  
  // Track currently selected lease context
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isContractVisible, setIsContractVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [selectedDetailPost, setSelectedDetailPost] = useState<Notice | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { adjustSize } = useElderlyMode();

  // Meter Reading & Billing States
  const [isMeterModalVisible, setIsMeterModalVisible] = useState(false);
  const [meterReadingStep, setMeterReadingStep] = useState<'scan' | 'breakdown' | 'qr'>('scan');
  const [meterKwh, setMeterKwh] = useState('');
  const [isScanningLoader, setIsScanningLoader] = useState(false);
  const [currentPaymentForBilling, setCurrentPaymentForBilling] = useState<Payment | null>(null);

  const getPendingBill = () => {
    return tenantPayments.find(p => p.status === 'Pending') || null;
  };

  const loadTenantData = () => {
    const leases = Database.getLeases();
    const properties = Database.getProperties();
    const payments = Database.getPayments();

    // jane tenant represents tenant-1
    const activeLeases = leases.filter(l => l.tenantId === 'tenant-1' && l.status === 'active');
    setTenantLeases(activeLeases);

    // Choose lease based on selectedLeaseId
    let lease = activeLeases.find(l => l.id === selectedLeaseId) || null;
    if (!lease && activeLeases.length > 0) {
      lease = activeLeases[0];
    }
    setActiveLease(lease);

    if (lease) {
      const prop = properties.find(p => p.id === lease.propertyId) || null;
      setProperty(prop);

      const payList = payments.filter(p => p.leaseId === lease.id);
      setTenantPayments(payList);
    } else {
      setProperty(null);
      setTenantPayments([]);
    }
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(loadTenantData);
    loadTenantData();
    return unsubscribe;
  }, [selectedLeaseId]);

  const handleSwitchRoom = () => {
    const properties = Database.getProperties();
    
    // Get room names for action sheet buttons
    const options = tenantLeases.map(l => {
      const prop = properties.find(p => p.id === l.propertyId);
      return prop ? prop.name : 'Unknown Room';
    });

    if (options.length <= 1) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...options],
          cancelButtonIndex: 0,
          title: 'Switch Active Rental Unit'
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selectedLease = tenantLeases[buttonIndex - 1];
            setSelectedLeaseId(selectedLease.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Switch Active Room',
        'Choose a room context:',
        options.map((name, idx) => ({
          text: name,
          onPress: () => setSelectedLeaseId(tenantLeases[idx].id)
        })),
        { cancelable: true }
      );
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return '#34C759'; // Green
    if (status === 'Overdue') return '#FF3B30'; // Red
    return '#007AFF'; // Blue (Pending)
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { fontSize: adjustSize(12) }]}>Welcome Back 👋</Text>
          {tenantLeases.length > 1 ? (
            <TouchableOpacity onPress={handleSwitchRoom} style={styles.roomSwitcherBtn}>
              <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>
                Jane Tenant ({property ? property.name : 'Select Room'} ▾)
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>Jane Tenant</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.profileHeaderBtn} 
          onPress={() => setIsDropdownVisible(!isDropdownVisible)}
        >
          <Text style={[styles.profileHeaderInitials, { fontSize: adjustSize(14) }]}>JT</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Profile Dropdown Menu Overlay ─── */}
      {isDropdownVisible && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => {
              setIsDropdownVisible(false);
              setIsProfileVisible(true);
            }}
          >
            <Text style={[styles.dropdownItemText, { fontSize: adjustSize(13) }]}>👤 View Profile</Text>
          </TouchableOpacity>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => {
              setIsDropdownVisible(false);
              setIsSettingsVisible(true);
            }}
          >
            <Text style={[styles.dropdownItemText, { fontSize: adjustSize(13) }]}>⚙️ Settings</Text>
          </TouchableOpacity>
          <View style={styles.dropdownDivider} />
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => {
              setIsDropdownVisible(false);
              logout();
              router.replace('/login');
            }}
          >
            <Text style={[styles.dropdownItemText, { color: '#FF3B30', fontSize: adjustSize(13) }]}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Lease Agreement Card */}
        <View style={styles.leaseCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Text style={[styles.cardHeaderIcon, { fontSize: adjustSize(16) }]}>📄</Text>
              <Text style={[styles.cardHeaderTitle, { fontSize: adjustSize(14) }]}>Active Lease Agreement</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.leaseDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>Rental Address</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {property ? property.address : '456 Greenway Blvd, Room 202'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>Monthly Rent</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                ${activeLease ? activeLease.monthlyRent.toLocaleString() : '1,200'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>Security Deposit</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                ${activeLease ? activeLease.securityDeposit.toLocaleString() : '1,200'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>Lease Duration</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {activeLease
                  ? `${activeLease.startDate} - ${activeLease.endDate}`
                  : 'Aug 1, 2026 - Jul 31, 2027'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Billing Action Banner (Missing MVP requirement) ─── */}
        {getPendingBill() ? (
          <TouchableOpacity 
            style={styles.billingBanner}
            onPress={() => {
              setCurrentPaymentForBilling(getPendingBill());
              setMeterKwh('');
              setMeterReadingStep('scan');
              setIsMeterModalVisible(true);
            }}
          >
            <View style={styles.bannerInfo}>
              <View style={styles.badgeRow}>
                <Text style={styles.bannerBadge}>{local('unrecorded_electricity')}</Text>
              </View>
              <Text style={styles.bannerTitle}>{local('billing_banner_title')}</Text>
              <Text style={styles.bannerSubtitle}>
                {local('billing_banner_desc')}
              </Text>
            </View>
            <View style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>{local('record_now')}</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* ─── Tenant Quick Actions & Links ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>Quick Links</Text>
          <View style={styles.quickLinksRow}>
            {/* View contract */}
            <TouchableOpacity style={styles.linkCard} onPress={() => setIsContractVisible(true)}>
              <Text style={[styles.linkIcon, { fontSize: adjustSize(28) }]}>📄</Text>
              <Text style={[styles.linkLabel, { fontSize: adjustSize(13) }]}>{local('view_lease')}</Text>
            </TouchableOpacity>

            {/* Contact Landlord */}
            <TouchableOpacity 
              style={styles.linkCard} 
              onPress={() => {
                Alert.alert(
                  'Liên Hệ Chủ Nhà',
                  'Số điện thoại: 0901234567\nBạn muốn nhắn tin qua Zalo hay gọi điện trực tiếp?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Nhắn Zalo', onPress: () => Linking.openURL('https://zalo.me/0901234567') },
                    { text: 'Gọi Điện', onPress: () => Linking.openURL('tel:0901234567') }
                  ]
                );
              }}
            >
              <Text style={[styles.linkIcon, { fontSize: adjustSize(28) }]}>💬</Text>
              <Text style={[styles.linkLabel, { fontSize: adjustSize(13) }]}>{local('contact_landlord')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payments List Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>Your Rent Payments</Text>
          {tenantPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No payment history logged.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {tenantPayments.map((item, index) => (
                <View key={item.id} style={styles.rowItem}>
                  <View style={styles.rowDetails}>
                    <Text style={[styles.rowPropName, { fontSize: adjustSize(14) }]}>{item.notes || 'Rent Invoice'}</Text>
                    <Text style={[styles.rowDate, { fontSize: adjustSize(11) }]}>Due: {item.dueDate}</Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={[styles.rowAmount, { fontSize: adjustSize(14) }]}>${item.amount.toLocaleString()}</Text>
                    <Text style={[styles.rowStatus, { color: getStatusColor(item.status), fontSize: adjustSize(11) }]}>
                      {item.status}
                    </Text>
                  </View>
                  {index < tenantPayments.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* ─── Meter reading, OCR extraction & QR pay flow ─── */}
      <Modal visible={isMeterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsMeterModalVisible(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {meterReadingStep === 'scan' && local('snap_electricity_meter')}
                {meterReadingStep === 'breakdown' && local('invoice_details')}
                {meterReadingStep === 'qr' && local('scan_payment_qr')}
              </Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Step 1: Scanner view */}
            {meterReadingStep === 'scan' && (
              <View style={{ flex: 1, backgroundColor: '#000' }}>
                {isScanningLoader ? (
                  <View style={styles.ocrLoaderContainer}>
                    <ActivityIndicator size="large" color="#34C759" />
                    <Text style={styles.ocrLoaderText}>{local('ocr_scanning')}</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    {/* Viewfinder area */}
                    <View style={styles.viewfinderContainer}>
                      <View style={styles.scanTarget} />
                      <Text style={styles.cameraInstructions}>
                        {local('align_meter_desc')}
                      </Text>
                    </View>

                    {/* Camera Control Footer */}
                    <View style={styles.cameraControls}>
                      <TouchableOpacity
                        style={styles.shutterButton}
                        onPress={() => {
                          setIsScanningLoader(true);
                          setTimeout(() => {
                            setIsScanningLoader(false);
                            // Simulate successful OCR extraction
                            setMeterKwh('235');
                            setMeterReadingStep('breakdown');
                            Vibration.vibrate(100);
                          }, 1500);
                        }}
                      >
                        <View style={styles.shutterInner} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Bill Breakdown Screen */}
            {meterReadingStep === 'breakdown' && (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.sectionLabel}>{local('meter_reading_section')}</Text>
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>{local('consumption_kwh')}</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={meterKwh}
                    onChangeText={setMeterKwh}
                    placeholder={local('enter_meter_kwh')}
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                <Text style={styles.inputHelperText}>
                  * Chỉ số được trích xuất bằng camera OCR. Bạn có thể tự chỉnh sửa tay nếu nhận diện sai.
                </Text>

                <Text style={styles.sectionLabel}>{local('monthly_bill_details')}</Text>
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{local('base_rent')}</Text>
                    <Text style={styles.breakdownValue}>
                      ${activeLease ? activeLease.monthlyRent.toLocaleString() : '0'}
                    </Text>
                  </View>
                  
                  {/* Electricity unit price: property.electricityRate VND / 25000 = USD */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      Tiền điện ({Number(meterKwh || 0)} kWh × ${property ? (property.electricityRate / 25000).toFixed(2) : '0.14'})
                    </Text>
                    <Text style={styles.breakdownValue}>
                      ${((Number(meterKwh || 0) * (property ? property.electricityRate / 25000 : 0.14))).toFixed(2)}
                    </Text>
                  </View>

                  {/* Water flat rate: property.waterRate VND / 25000 = USD */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{local('water_bill')}</Text>
                    <Text style={styles.breakdownValue}>
                      ${property ? (property.waterRate / 25000).toFixed(2) : '0.00'}
                    </Text>
                  </View>

                  {/* Service flat rate: property.serviceFee VND / 25000 = USD */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{local('services_bill')}</Text>
                    <Text style={styles.breakdownValue}>
                      ${property ? (property.serviceFee / 25000).toFixed(2) : '0.00'}
                    </Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownRowTotal}>
                    <Text style={styles.breakdownLabelTotal}>{local('grand_total')}</Text>
                    <Text style={styles.breakdownValueTotal}>
                      ${(
                        (activeLease ? activeLease.monthlyRent : 0) +
                        (Number(meterKwh || 0) * (property ? property.electricityRate / 25000 : 0.14)) +
                        (property ? property.waterRate / 25000 : 0) +
                        (property ? property.serviceFee / 25000 : 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.payNowBtn}
                  onPress={() => setMeterReadingStep('qr')}
                >
                  <Text style={styles.payNowBtnText}>{local('proceed_to_pay')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Step 3: VietQR Code display */}
            {meterReadingStep === 'qr' && (
              <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>{local('vietqr_transfer')}</Text>
                <Text style={styles.qrSubtitle}>
                  {local('vietqr_instruction')}
                </Text>

                {/* Mock QR graphic */}
                <View style={styles.qrGraphicCard}>
                  <View style={styles.qrTopHeader}>
                    <Text style={styles.qrBrand}>VietQR</Text>
                    <Text style={styles.qrBankName}>MB Bank</Text>
                  </View>
                  
                  {/* Decorative QR code mockup */}
                  <View style={styles.qrGraphicPlaceholder}>
                    <View style={[styles.qrCorner, { top: 0, left: 0 }]} />
                    <View style={[styles.qrCorner, { top: 0, right: 0 }]} />
                    <View style={[styles.qrCorner, { bottom: 0, left: 0 }]} />
                    <View style={styles.qrCenterDot} />
                    <Text style={styles.qrCenterText}>RENTIFY PAY</Text>
                  </View>

                  <View style={styles.qrAmountRow}>
                    <Text style={styles.qrAmountLabel}>{local('payment_amount')}</Text>
                    <Text style={styles.qrAmountValue}>
                      ${(
                        (activeLease ? activeLease.monthlyRent : 0) +
                        (Number(meterKwh || 0) * (property ? property.electricityRate / 25000 : 0.14)) +
                        (property ? property.waterRate / 25000 : 0) +
                        (property ? property.serviceFee / 25000 : 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Details layout */}
                <View style={styles.transferDetailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{local('account_holder')}</Text>
                    <Text style={styles.detailValue}>NGUYEN VAN CHU NHA</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{local('account_number')}</Text>
                    <Text style={styles.detailValue}>0901234567</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{local('transfer_message')}</Text>
                    <Text style={styles.detailValue}>
                      Rentify thanh toan {property ? property.name : 'phong'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmPayBtn}
                  onPress={() => {
                    const finalAmount = (
                      (activeLease ? activeLease.monthlyRent : 0) +
                      (Number(meterKwh || 0) * (property ? property.electricityRate / 25000 : 0.14)) +
                      (property ? property.waterRate / 25000 : 0) +
                      (property ? property.serviceFee / 25000 : 0)
                    );
                    
                    if (currentPaymentForBilling) {
                      Database.updatePaymentAmountAndStatus(
                        currentPaymentForBilling.id,
                        finalAmount,
                        'Paid'
                      );
                    }
                    
                    Vibration.vibrate([0, 100, 50, 100]);
                    Alert.alert(local('payment_success'), local('payment_success_desc'));
                    setIsMeterModalVisible(false);
                  }}
                >
                  <Text style={styles.confirmPayBtnText}>{local('confirm_transferred')}</Text>
                </TouchableOpacity>
              </View>
            )}

          </SafeAreaView>
        </View>
      </Modal>

      <ProfileModal
        visible={isProfileVisible}
        onClose={() => setIsProfileVisible(false)}
        onPostClick={(item) => {
          setIsProfileVisible(false);
          setTimeout(() => {
            setSelectedDetailPost(item);
          }, 400);
        }}
      />

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />

      <PostDetailModal
        visible={selectedDetailPost !== null}
        item={selectedDetailPost}
        commenterName={language === 'vi' ? 'Cư dân - Phòng 102' : 'Resident - Room 102'}
        onClose={() => setSelectedDetailPost(null)}
      />

      {/* ─── Contract Viewer Modal ─── */}
      <Modal visible={isContractVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsContractVisible(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Lease Contract Document</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ alignItems: 'center' }}>
              <Text style={styles.contractLabel}>Signed Lease Agreement</Text>
              <View style={styles.documentMock}>
                <Text style={styles.docHeader}>RENTAL AGREEMENT</Text>
                <Text style={styles.docBody}>
                  This Lease Agreement is entered into between Landlord and Resident Jane Tenant for rental unit: 
                  {"\n\n"}{property ? property.name : 'Oakridge Apartment'}
                  {"\n\n"}Terms:
                  {"\n"}- Monthly rent: ${activeLease ? activeLease.monthlyRent : '1,200'}
                  {"\n"}- Security deposit: ${activeLease ? activeLease.securityDeposit : '1,200'}
                  {"\n"}- Duration: {activeLease ? activeLease.startDate : '2026-08-01'} to {activeLease ? activeLease.endDate : '2027-07-31'}
                  {"\n\n"}Signed & Sealed under Rentify Security.
                </Text>
                <View style={styles.docSignatures}>
                  <Text style={styles.signatureText}>Landlord: [Signed]</Text>
                  <Text style={styles.signatureText}>Tenant: [Signed]</Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
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
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  welcomeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginTop: 2
  },
  roomSwitcherBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16
  },
  linkCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  linkIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  // Modal styles for document viewer
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    height: '80%',
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
    color: '#007AFF',
    fontWeight: '600'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  modalScroll: {
    padding: 20
  },
  contractLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center'
  },
  documentMock: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  docHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1
  },
  docBody: {
    fontSize: 14,
    color: '#2C2C2E',
    lineHeight: 22,
    fontWeight: '500'
  },
  docSignatures: {
    marginTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 16
  },
  signatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    fontStyle: 'italic'
  },
  // ─── Billing Action Banner ───
  billingBanner: {
    backgroundColor: '#FF95001A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FF95004D'
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    backgroundColor: '#FF950026',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden'
  },
  bannerInfo: {
    flex: 1,
    paddingRight: 10
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600'
  },
  bannerBtn: {
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  bannerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800'
  },
  // ─── OCR view styles ───
  ocrLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  ocrLoaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scanTarget: {
    width: 260,
    height: 160,
    borderWidth: 2.5,
    borderColor: '#34C759',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  cameraInstructions: {
    color: '#E5E5EA',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 24
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 40
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF'
  },
  cameraControls: {
    backgroundColor: '#000',
    paddingVertical: 20
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8
  },
  inputCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  textInput: {
    width: 120,
    height: 36,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
    padding: 0
  },
  inputHelperText: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 16
  },
  breakdownCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600'
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4
  },
  breakdownRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  breakdownLabelTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  breakdownValueTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34C759'
  },
  payNowBtn: {
    height: 52,
    backgroundColor: '#34C759',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 40
  },
  payNowBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  // ─── VietQR views ───
  qrContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center'
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 6
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 20
  },
  qrGraphicCard: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    padding: 16,
    alignItems: 'center',
    marginBottom: 20
  },
  qrTopHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  qrBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: '#007AFF',
    fontStyle: 'italic'
  },
  qrBankName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5856D6'
  },
  qrGraphicPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: '#34C759'
  },
  qrCenterDot: {
    width: 40,
    height: 40,
    backgroundColor: '#34C759',
    borderRadius: 8
  },
  qrCenterText: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900'
  },
  qrAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  qrAmountLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600'
  },
  qrAmountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E'
  },
  transferDetailCard: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 30
  },
  confirmPayBtn: {
    height: 52,
    width: '100%',
    backgroundColor: '#34C759',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  confirmPayBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B301A',
    borderRadius: 12
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B30'
  },
  scrollContent: {
    paddingBottom: 40
  },
  leaseCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardHeaderIcon: {
    fontSize: 18,
    marginRight: 6
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  activeBadge: {
    backgroundColor: '#34C75926',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34C759'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginBottom: 12
  },
  leaseDetails: {
    gap: 10
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12
  },
  emptyCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center'
  },
  emptyCardText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600'
  },
  listCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 8
  },
  rowItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative'
  },
  rowDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rowPropName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  rowDate: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 4
  },
  rowValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  rowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  rowStatus: {
    fontSize: 12,
    fontWeight: '700'
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16
  },
  profileHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C7591F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#34C759'
  },
  profileHeaderInitials: {
    fontWeight: '900',
    color: '#34C759'
  },
  // Dropdown overlay styles
  dropdownOverlay: {
    position: 'absolute',
    top: 125, // right under header in safearea
    right: 16,
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 9999
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  dropdownItemText: {
    fontWeight: '700',
    color: '#1C1C1E'
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F2F2F7'
  }
});
