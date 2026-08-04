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
  TextInput,
  Image,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, AuthManager } from '../../services/AuthManager';
import { Database, Property, Lease, Payment } from '../../services/Database';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { useLanguage } from '../../services/LanguageManager';
import { ProfileModal } from '../../components/ProfileModal';
import { SettingsModal } from '../../components/SettingsModal';
import { PostDetailModal } from '../../components/PostDetailModal';
import { Notice } from '../../services/NoticeRepository';
import { FireConfirmationModal } from '../../components/FireConfirmationModal';
import { formatVND } from '../../services/CurrencyUtils';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
 
export default function TenantPortal() {
  const { local, language } = useLanguage();
  const router = useRouter();
  const { logout } = useAuth();
 
  const [activeLease, setActiveLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([]);
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
   
  // Track currently selected lease context
  const [isContractVisible, setIsContractVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [selectedDetailPost, setSelectedDetailPost] = useState<Notice | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isFireConfirmVisible, setIsFireConfirmVisible] = useState(false);
  const { adjustSize } = useEasyViewMode();

  // Meter Reading & Billing States
  const [isMeterModalVisible, setIsMeterModalVisible] = useState(false);
  const [meterReadingStep, setMeterReadingStep] = useState<'scan' | 'breakdown' | 'qr'>('scan');
  const [meterKwh, setMeterKwh] = useState('');
  const [isScanningLoader, setIsScanningLoader] = useState(false);
  const [currentPaymentForBilling, setCurrentPaymentForBilling] = useState<Payment | null>(null);
  
  const [waitingForPaymentReturn, setWaitingForPaymentReturn] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (waitingForPaymentReturn && nextAppState === 'active') {
        setWaitingForPaymentReturn(false);
        const finalAmount =
          (activeLease?.monthlyRent ?? 0) +
          (Number(meterKwh || 0) * (property?.electricityRate ?? 3500)) +
          (property?.waterRate ?? 0) +
          (property?.serviceFee ?? 0);

        if (currentPaymentForBilling) {
          Database.updatePaymentAmountAndStatus(
            currentPaymentForBilling.id,
            finalAmount,
            'Paid'
          );
        }

        Vibration.vibrate([0, 100, 50, 100]);
        Alert.alert(local('payment_confirmed'), local('payment_confirmed_desc'));
        setIsMeterModalVisible(false);
        setMeterReadingStep('scan');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [waitingForPaymentReturn, activeLease, meterKwh, property, currentPaymentForBilling, local]);

  const initiateMockPayment = (url?: string, fallback?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        if (fallback) Linking.openURL(fallback);
      });
      setWaitingForPaymentReturn(true);
    } else {
      Linking.openURL('https://my.vnpay.com.vn/').catch(() => {});
      setWaitingForPaymentReturn(true);
    }
  };

  const getPendingBill = () => {
    return tenantPayments.find(p => p.status === 'Pending') || null;
  };

  const loadTenantData = () => {
    const leases = Database.getLeases();
    const properties = Database.getProperties();
    const payments = Database.getPayments();

    const loggedInId = AuthManager.getLoggedInTenantId();
    const activeLeases = leases.filter(l => l.tenantId === loggedInId && l.status === 'active');
    setTenantLeases(activeLeases);

    // Choose lease based on selectedLeaseId from global Database state
    const globalLeaseId = Database.getActiveTenantLeaseId();
    let lease = activeLeases.find(l => l.id === globalLeaseId) || null;
    if (!lease && activeLeases.length > 0) {
      lease = activeLeases[0];
      Database.setActiveTenantLeaseId(lease.id);
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
  }, []);

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
            Database.setActiveTenantLeaseId(selectedLease.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Switch Active Room',
        'Choose a room context:',
        options.map((name, idx) => ({
          text: name,
          onPress: () => Database.setActiveTenantLeaseId(tenantLeases[idx].id)
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.welcomeText, { fontSize: adjustSize(12) }]}>Welcome Back 👋</Text>
          {(() => {
            const currentTenant = Database.getTenants().find(t => t.id === AuthManager.getLoggedInTenantId());
            const tenantName = currentTenant ? currentTenant.name : 'Resident';
            
            if (tenantLeases.length > 1) {
              return (
                <TouchableOpacity onPress={handleSwitchRoom} style={styles.roomSwitcherBtn}>
                  <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]} numberOfLines={1}>
                    {tenantName} ({property ? property.name : 'Select Room'} ▾)
                  </Text>
                </TouchableOpacity>
              );
            } else {
              return (
                <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>
                  {tenantName}
                </Text>
              );
            }
          })()}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.profileHeaderBtn, { backgroundColor: '#FF3B301A', borderColor: '#FF3B3033' }]}
            onPress={() => setIsFireConfirmVisible(true)}
            accessibilityLabel="Emergency Fire Alert"
          >
            <Text style={{ fontSize: 18 }}>🚨</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileHeaderBtn} 
            onPress={() => setIsDropdownVisible(!isDropdownVisible)}
          >
            <Text style={[styles.profileHeaderInitials, { fontSize: adjustSize(14) }]}>
              {(() => {
                const currentTenant = Database.getTenants().find(t => t.id === AuthManager.getLoggedInTenantId());
                if (currentTenant) {
                  const parts = currentTenant.name.split(' ');
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  }
                  return currentTenant.name.substring(0, 2).toUpperCase();
                }
                return 'JT';
              })()}
            </Text>
          </TouchableOpacity>
        </View>
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
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('rental_address')}</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {property ? property.address : '456 Greenway Blvd, Room 202'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('monthly_rent')}</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {activeLease ? formatVND(activeLease.monthlyRent) : formatVND(3500000)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('security_deposit')}</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {activeLease ? formatVND(activeLease.securityDeposit) : formatVND(3500000)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: adjustSize(13) }]}>{local('lease_duration')}</Text>
              <Text style={[styles.detailValue, { fontSize: adjustSize(13) }]}>
                {activeLease
                  ? `${activeLease.startDate} - ${activeLease.endDate}`
                  : 'Aug 1, 2026 - Jul 31, 2027'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Lease Expiration Warning Banner (MVP D2) ─── */}
        {(() => {
          if (!activeLease) return null;
          // Calculate days remaining
          const end = new Date(activeLease.endDate);
          const now = new Date();
          end.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          const diffTime = end.getTime() - now.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const warningDays = Database.getAppConfig().leaseWarningDays;
          const isExpiringSoon = daysRemaining > 0 && daysRemaining <= warningDays;

          if (!isExpiringSoon) return null;

          return (
            <View style={styles.expirationBanner}>
              <Text style={styles.expirationBannerIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.expirationBannerTitle}>
                  {language === 'vi' ? 'Hợp đồng sắp hết hạn!' : 'Lease Expiring Soon!'}
                </Text>
                <Text style={styles.expirationBannerDesc}>
                  {language === 'vi'
                    ? `Hợp đồng phòng sẽ hết hạn vào ngày ${activeLease.endDate}. Còn lại ${daysRemaining} ngày.`
                    : `Your room lease agreement expires on ${activeLease.endDate}. ${daysRemaining} days remaining.`}
                </Text>
              </View>
            </View>
          );
        })()}

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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>{local('quick_links')}</Text>
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
                  local('contact_landlord'),
                  '0901234567',
                  [
                    { text: local('cancel'), style: 'cancel' },
                    { text: 'Zalo', onPress: () => Linking.openURL('https://zalo.me/0901234567') },
                    { text: language === 'vi' ? 'Gọi điện' : 'Call', onPress: () => Linking.openURL('tel:0901234567').catch(() => Alert.alert(local('error') || 'Error', 'Phone calls are not supported on this simulator.')) }
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
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>{local('your_payments')}</Text>
          {tenantPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>{local('no_payment_history_tenant')}</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {tenantPayments.map((item, index) => (
                <View key={item.id} style={styles.rowItem}>
                  <View style={styles.rowDetails}>
                    <Text style={[styles.rowPropName, { fontSize: adjustSize(14) }]}>{item.notes || local('your_payments')}</Text>
                    <Text style={[styles.rowDate, { fontSize: adjustSize(11) }]}>{local('due_label')} {item.dueDate}</Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={[styles.rowAmount, { fontSize: adjustSize(14) }]}>{formatVND(item.amount)}</Text>
                    <Text style={[styles.rowStatus, { color: getStatusColor(item.status), fontSize: adjustSize(11) }]}>
                      {item.status === 'Paid' ? local('filter_paid') : local('filter_pending')}
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
          <View style={[styles.modalContent, { height: '92%' }]}>
            
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

                      {/* Shutter Button -> Trigger Mock Scan Directly */}
                      <TouchableOpacity
                        style={styles.shutterButton}
                        onPress={() => {
                          setIsScanningLoader(true);
                          setTimeout(() => {
                            setIsScanningLoader(false);
                            setMeterKwh('248');
                            setMeterReadingStep('breakdown');
                            Vibration.vibrate(100);
                          }, 1500);
                        }}
                      >
                        <View style={styles.shutterInner} />
                      </TouchableOpacity>

                      {/* Gallery Button */}
                      <TouchableOpacity
                        style={[styles.secondaryScanBtn, { position: 'absolute', right: 30 }]}
                        onPress={async () => {
                          const launchLibrary = async () => {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                              Alert.alert('Permission Required', 'Photo library access is needed.');
                              return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ['images'],
                              quality: 0.8,
                            });
                            if (!result.canceled && result.assets.length > 0) {
                              setIsScanningLoader(true);
                              setTimeout(() => {
                                setIsScanningLoader(false);
                                setMeterKwh('248');
                                setMeterReadingStep('breakdown');
                                Vibration.vibrate(100);
                              }, 1500);
                            }
                          };

                          const launchFilePicker = async () => {
                            try {
                              const result = await DocumentPicker.getDocumentAsync({
                                type: ['image/*', 'application/pdf'],
                                copyToCacheDirectory: true
                              });
                              if (!result.canceled && result.assets.length > 0) {
                                setIsScanningLoader(true);
                                setTimeout(() => {
                                  setIsScanningLoader(false);
                                  setMeterKwh('248');
                                  setMeterReadingStep('breakdown');
                                  Vibration.vibrate(100);
                                }, 1500);
                              }
                            } catch (err) {
                              console.log('File picker error: ', err);
                            }
                          };

                          if (Platform.OS === 'ios') {
                            ActionSheetIOS.showActionSheetWithOptions(
                              {
                                options: ['Cancel', 'Photo Library', 'Browse Files'],
                                cancelButtonIndex: 0
                              },
                              (buttonIndex) => {
                                if (buttonIndex === 1) launchLibrary();
                                else if (buttonIndex === 2) launchFilePicker();
                              }
                            );
                          } else {
                            Alert.alert(
                              'Select Meter Photo Source',
                              'Choose how you want to upload the meter photo:',
                              [
                                { text: 'Photo Library', onPress: launchLibrary },
                                { text: 'Browse Files', onPress: launchFilePicker },
                                { text: 'Cancel', style: 'cancel' }
                              ]
                            );
                          }
                        }}
                      >
                        <Text style={styles.secondaryScanText}>Gallery</Text>
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
                      {activeLease ? formatVND(activeLease.monthlyRent) : formatVND(0)}
                    </Text>
                  </View>

                  {/* Electricity: kWh × rate (both in VND) */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      {language === 'vi' ? 'Tiền điện' : 'Electricity'} ({Number(meterKwh || 0)} kWh × {formatVND(property?.electricityRate ?? 3500)}/kWh)
                    </Text>
                    <Text style={styles.breakdownValue}>
                      {formatVND(Number(meterKwh || 0) * (property?.electricityRate ?? 3500))}
                    </Text>
                  </View>

                  {/* Water flat rate in VND */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{local('water_bill')}</Text>
                    <Text style={styles.breakdownValue}>
                      {formatVND(property?.waterRate ?? 0)}
                    </Text>
                  </View>

                  {/* Service flat rate in VND */}
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{local('services_bill')}</Text>
                    <Text style={styles.breakdownValue}>
                      {formatVND(property?.serviceFee ?? 0)}
                    </Text>
                  </View>

                  <View style={styles.breakdownDivider} />

                  <View style={styles.breakdownRowTotal}>
                    <Text style={styles.breakdownLabelTotal}>{local('grand_total')}</Text>
                    <Text style={styles.breakdownValueTotal}>
                      {formatVND(
                        (activeLease?.monthlyRent ?? 0) +
                        (Number(meterKwh || 0) * (property?.electricityRate ?? 3500)) +
                        (property?.waterRate ?? 0) +
                        (property?.serviceFee ?? 0)
                      )}
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
                <TouchableOpacity activeOpacity={0.9} style={styles.qrGraphicCard} onPress={() => initiateMockPayment()}>
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
                      {formatVND(
                        (activeLease?.monthlyRent ?? 0) +
                        (Number(meterKwh || 0) * (property?.electricityRate ?? 3500)) +
                        (property?.waterRate ?? 0) +
                        (property?.serviceFee ?? 0)
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>

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

                {/* Bank app deep-link buttons */}
                <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
                  {local('open_bank_app')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
                  {[
                    { label: 'MB Bank', url: 'mbmobile://', fallback: 'https://apps.apple.com/vn/app/mb-bank/id1492405498' },
                    { label: 'VCB', url: 'vcbdigibank://', fallback: 'https://apps.apple.com/vn/app/vcb-digibank/id898009008' },
                    { label: 'MoMo', url: 'momo://', fallback: 'https://apps.apple.com/vn/app/momo-vi-ti%E1%BB%87n/id918751511' }
                  ].map(bank => (
                    <TouchableOpacity
                      key={bank.label}
                      style={{ backgroundColor: '#007AFF15', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#007AFF33' }}
                      onPress={() => {
                        initiateMockPayment(bank.url, bank.fallback);
                      }}
                    >
                      <Text style={{ color: '#007AFF', fontWeight: '700', fontSize: 13 }}>{bank.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.confirmPayBtn}
                  onPress={() => {
                    initiateMockPayment();
                  }}
                >
                  <Text style={styles.confirmPayBtnText}>{local('confirm_transferred')}</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsContractVisible(false)}>
                <Text style={styles.modalCancel}>{local('close')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{local('rental_agreement')}</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ alignItems: 'center' }}>
              <Text style={styles.contractLabel}>{local('rental_agreement')}</Text>
              <View style={styles.documentMock}>
                <Text style={styles.docHeader}>{local('rental_agreement').toUpperCase()}</Text>
                <Text style={styles.docBody}>
                  {language === 'vi'
                    ? `Hợp đồng này được ký giữa Chủ Nhà và Cư dân cho phòng:`
                    : 'This Lease Agreement is entered into between Landlord and Resident for rental unit:'}
                  {'\n\n'}{property ? property.name : 'Phòng'}
                  {'\n\n'}{language === 'vi' ? 'Điều khoản:' : 'Terms:'}
                  {'\n'}- {local('monthly_rent')}: {activeLease ? formatVND(activeLease.monthlyRent) : formatVND(3500000)}
                  {'\n'}- {local('security_deposit')}: {activeLease ? formatVND(activeLease.securityDeposit) : formatVND(3500000)}
                  {'\n'}- {local('lease_duration')}: {activeLease ? `${activeLease.startDate} – ${activeLease.endDate}` : '2026-08-01 – 2027-07-31'}
                  {'\n\n'}{language === 'vi' ? 'Được ký và niêm phong bởi Rentify Security.' : 'Signed & Sealed under Rentify Security.'}
                </Text>
                <View style={styles.docSignatures}>
                  <Text style={styles.signatureText}>{language === 'vi' ? 'Chủ nhà: [Đã ký]' : 'Landlord: [Signed]'}</Text>
                  <Text style={styles.signatureText}>{language === 'vi' ? 'Người thuê: [Đã ký]' : 'Tenant: [Signed]'}</Text>
                </View>
              </View>

              {/* Contract photo */}
              {activeLease?.contractPhoto ? (
                <View style={{ width: '100%', marginTop: 16 }}>
                  <Text style={[styles.contractLabel, { marginBottom: 8 }]}>{local('contract_photo_label')}</Text>
                  <Image
                    source={{ uri: activeLease.contractPhoto }}
                    style={{ width: '100%', height: 220, borderRadius: 12, resizeMode: 'cover' }}
                  />
                </View>
              ) : (
                <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 12 }}>{local('no_contract_photo')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>


      
      <FireConfirmationModal
        visible={isFireConfirmVisible}
        onClose={() => setIsFireConfirmVisible(false)}
        onConfirm={async () => {
          const NoticeRepository = require('../../services/NoticeRepository').NoticeRepository;
          const NotificationManager = require('../../services/NotificationManager').NotificationManager;
          
          await NoticeRepository.addNotice(
            'fire',
            local('emergency_fire_alert'),
            local('fire_alert_message'),
            language === 'vi' ? `Cư dân - ${property?.name || 'Phòng'}` : `Resident - ${property?.name || 'Room'}`,
            new Date(),
            undefined,
            true,
            property?.khuTroId
          );
          
          await NotificationManager.triggerLocalNotification(
            '🔥 ' + local('emergency_fire_alert'),
            local('fire_alert_message')
          );
        }}
      />
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
    justifyContent: 'center'
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF'
  },
  cameraControls: {
    backgroundColor: '#000',
    paddingVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50
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
  },
  expirationBanner: {
    flexDirection: 'row',
    backgroundColor: '#FF95001A',
    borderWidth: 1.5,
    borderColor: '#FF950033',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    gap: 12
  },
  expirationBannerIcon: {
    fontSize: 24
  },
  expirationBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF9500'
  },
  expirationBannerDesc: {
    fontSize: 13,
    color: '#FF9500BB',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18
  },
  secondaryScanBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryScanText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
