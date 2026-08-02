//
//  payments.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  Vibration
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Database, Property, Tenant, Lease, Payment, PaymentStatus } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useElderlyMode } from '../../services/AccessibilityManager';
import { BillingConfigModal } from '../../components/BillingConfigModal';

// Helper: format Date → "YYYY-MM-DD" string for storage
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper: format Date → "Aug 1, 2026" readable label
const formatLabel = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function LandlordPayments() {
  const { local } = useLanguage();
  const { adjustSize } = useElderlyMode();
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const params = useLocalSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Filtering
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PaymentStatus | 'All'>('All');

  // Modal visibility
  const [isAddLeaseVisible, setIsAddLeaseVisible] = useState(false);

  // Auto-open modal if query parameter set
  useEffect(() => {
    if (params.openNewLease === 'true') {
      setIsAddLeaseVisible(true);
      if (params.propertyId) {
        setSelectedPropertyId(params.propertyId as string);
      }
      if (params.tenantId) {
        setSelectedTenantId(params.tenantId as string);
      }
    }
  }, [params.openNewLease, params.propertyId, params.tenantId]);

  // Form state — dates stored as Date objects
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [startDate, setStartDate] = useState(new Date('2026-08-01'));
  const [endDate, setEndDate] = useState(new Date('2027-07-31'));
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  // Camera mock states
  const [tenantPhoto, setTenantPhoto] = useState<string | undefined>(undefined);
  const [contractPhoto, setContractPhoto] = useState<string | undefined>(undefined);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState<'tenant' | 'contract'>('tenant');

  // Each picker needs two independent booleans:
  //   isMounted — controls whether the DateTimePicker is in the tree at all
  //   isOpen    — drives the animation value (0 = closed, 1 = open)
  // Opening:  mount first, then animate open.
  // Closing:  animate to 0 first, unmount only inside the spring callback.
  // This prevents the layout snap that occurs when the picker is removed from
  // the tree before the height animation has fully settled at 0.

  const [startMounted, setStartMounted] = useState(false);
  const [endMounted,   setEndMounted]   = useState(false);
  const startPickerAnim = useRef(new Animated.Value(0)).current;
  const endPickerAnim   = useRef(new Animated.Value(0)).current;

  const PICKER_HEIGHT = 180;

  const openPicker  = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
  };
  const closePicker = (anim: Animated.Value, unmount: () => void) => {
    Animated.spring(anim, { toValue: 0, useNativeDriver: false, tension: 60, friction: 10 }).start(({ finished }) => {
      if (finished) unmount();
    });
  };

  const toggleStartPicker = () => {
    if (!startMounted) {
      // Close end picker first if open
      if (endMounted) closePicker(endPickerAnim, () => setEndMounted(false));
      setStartMounted(true);
      // Give React a frame to mount before animating
      requestAnimationFrame(() => openPicker(startPickerAnim));
    } else {
      closePicker(startPickerAnim, () => setStartMounted(false));
    }
  };

  const toggleEndPicker = () => {
    if (!endMounted) {
      if (startMounted) closePicker(startPickerAnim, () => setStartMounted(false));
      setEndMounted(true);
      requestAnimationFrame(() => openPicker(endPickerAnim));
    } else {
      closePicker(endPickerAnim, () => setEndMounted(false));
    }
  };

  // Exact keyboard height — updated by native keyboard events
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const formScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const refreshData = () => {
    setPayments([...Database.getPayments()]);
    setLeases([...Database.getLeases()]);
    setProperties([...Database.getProperties()]);
    setTenants([...Database.getTenants()]);
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(refreshData);
    refreshData();
    return unsubscribe;
  }, []);

  // Auto-fill rent from property
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setMonthlyRent(prop.rentAmount.toString());
        setSecurityDeposit(prop.rentAmount.toString());
      }
    }
  }, [selectedPropertyId]);

  const onDateChange = (picker: 'start' | 'end') =>
    (_event: DateTimePickerEvent, selected?: Date) => {
      if (selected) {
        if (picker === 'start') setStartDate(selected);
        else setEndDate(selected);
      }
      // On Android close picker immediately after selection
      if (Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (picker === 'start') setStartMounted(false);
        else setEndMounted(false);
      }
    };

  const handleCreateLease = () => {
    if (!selectedPropertyId || !selectedTenantId) return;

    Database.createLease({
      propertyId: selectedPropertyId,
      tenantId: selectedTenantId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit),
      tenantPhoto,
      contractPhoto
    });

    // Reset form
    setSelectedPropertyId('');
    setSelectedTenantId('');
    setStartDate(new Date('2026-08-01'));
    setEndDate(new Date('2027-07-31'));
    setMonthlyRent('');
    setSecurityDeposit('');
    setTenantPhoto(undefined);
    setContractPhoto(undefined);
    closeAllPickers();
    setIsAddLeaseVisible(false);
    Alert.alert('Lease Agreement Saved', 'Lease has been activated. Invoices were generated.');
  };

  const handleSendManualReminder = (pay: Payment) => {
    const info = getPaymentDisplayData(pay);
    Alert.alert(
      'Send Invoice Reminder',
      `Send rent invoice reminder for ${info.propertyName} (Tenant: ${info.tenantName}) via Zalo & Push?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            Alert.alert(
              'Reminder Sent',
              `Manual reminder successfully sent to ${info.tenantName} for payment amount of $${info.amount.toLocaleString()}.`
            );
          } 
        }
      ]
    );
  };

  const closeAllPickers = () => {
    closePicker(startPickerAnim, () => setStartMounted(false));
    closePicker(endPickerAnim,   () => setEndMounted(false));
  };

  const handleRecordPaid = (id: string) => {
    Alert.alert(
      'Confirm Payment',
      'Record this payment as received?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Record Paid', onPress: () => { Database.recordPaymentReceived(id); } }
      ]
    );
  };

  const getPaymentDisplayData = (pay: Payment) => {
    const lease = leases.find(l => l.id === pay.leaseId);
    const prop = lease ? properties.find(p => p.id === lease.propertyId) : null;
    const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
    return {
      propertyName: prop ? prop.name : 'Unknown Property',
      tenantName: tenant ? tenant.name : 'Unknown Tenant',
      dueDate: pay.dueDate,
      amount: pay.amount,
      status: pay.status
    };
  };

  const filteredPayments = payments.filter(p => {
    if (selectedStatusFilter === 'All') return true;
    return p.status === selectedStatusFilter;
  });

  const getStatusStyles = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid':    return { bg: '#34C75926', text: '#34C759' };
      case 'Overdue': return { bg: '#FF3B3026', text: '#FF3B30' };
      default:        return { bg: '#007AFF26', text: '#007AFF' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>Payments & Leases</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.configActionBtn} 
            onPress={() => setIsConfigVisible(true)}
            accessibilityLabel="Billing Configuration"
          >
            <Text style={[styles.configActionText, { fontSize: adjustSize(16) }]}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addBtnHeader} 
            onPress={() => setIsAddLeaseVisible(true)}
            accessibilityLabel="New Lease"
          >
            <Text style={[styles.addText, { fontSize: adjustSize(16) }]}>➕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Paid', 'Pending', 'Overdue'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, selectedStatusFilter === f && styles.filterTabActive]}
            onPress={() => setSelectedStatusFilter(f)}
          >
            <Text style={[styles.filterTabText, selectedStatusFilter === f && styles.filterTabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No Payments</Text>
            <Text style={styles.emptyDesc}>No payments found for status: {selectedStatusFilter}.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const info = getPaymentDisplayData(item);
          const colors = getStatusStyles(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.details}>
                <Text style={styles.propertyName}>{info.propertyName}</Text>
                <Text style={styles.tenantName}>Tenant: {info.tenantName}</Text>
                <Text style={styles.dueDate}>Due: {info.dueDate}</Text>
              </View>
              <View style={styles.values}>
                <Text style={styles.amount}>${info.amount.toLocaleString()}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {item.status !== 'Paid' ? (
                    <TouchableOpacity
                      style={[styles.statusBadge, { backgroundColor: colors.bg }]}
                      onPress={() => handleRecordPaid(item.id)}
                    >
                      <Text style={[styles.statusText, { color: colors.text }]}>
                        {item.status} (Tap to pay)
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  )}
                  {item.status !== 'Paid' && (
                    <TouchableOpacity
                      style={styles.remindBtn}
                      onPress={() => handleSendManualReminder(item)}
                    >
                      <Text style={styles.remindBtnText}>🔔 Remind</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ─── New Lease Modal ─── */}
      <Modal visible={isAddLeaseVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { closeAllPickers(); setIsAddLeaseVisible(false); }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Lease</Text>
              <TouchableOpacity
                onPress={handleCreateLease}
                disabled={!selectedPropertyId || !selectedTenantId}
                style={(!selectedPropertyId || !selectedTenantId) && { opacity: 0.4 }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Form — ScrollView with exact keyboard padding */}
              <ScrollView
                ref={formScrollRef}
                style={styles.formScroll}
                contentContainerStyle={{ paddingBottom: keyboardHeight + 32 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* ── Property & Tenant ── */}
                <Text style={styles.label}>Property & Tenant</Text>

                <View style={styles.pickerBox}>
                  <Text style={styles.pickerTitle}>Select Property:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionRow}>
                    {properties.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.selectItem, selectedPropertyId === p.id && styles.selectItemActive]}
                        onPress={() => setSelectedPropertyId(p.id)}
                      >
                        <Text style={[styles.selectText, selectedPropertyId === p.id && styles.selectTextActive]}>
                          {p.name} ({p.isOccupied ? 'Occupied' : 'Vacant'})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.pickerBox}>
                  <Text style={styles.pickerTitle}>Select Tenant:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionRow}>
                    {tenants.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.selectItem, selectedTenantId === t.id && styles.selectItemActive]}
                        onPress={() => setSelectedTenantId(t.id)}
                      >
                        <Text style={[styles.selectText, selectedTenantId === t.id && styles.selectTextActive]}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* ── Lease Terms ── */}
                <Text style={styles.label}>Lease Terms</Text>

                {/* Start Date row */}
                <TouchableOpacity
                  style={styles.inputBoxRow}
                  onPress={toggleStartPicker}
                >
                  <Text style={styles.rowLabel}>Start Date</Text>
                  <View style={styles.dateValueRow}>
                    <Text style={styles.dateValue}>{formatLabel(startDate)}</Text>
                    <Text style={[styles.dateChevron, startMounted && styles.dateChevronOpen]}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* Start picker — always mounted, height driven by LayoutAnimation */}
                <View style={[styles.pickerWrapper, { height: startMounted ? PICKER_HEIGHT : 0 }]}>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange('start')}
                    style={{ flex: 1 }}
                  />
                </View>

                {/* End Date row */}
                <TouchableOpacity
                  style={styles.inputBoxRow}
                  onPress={toggleEndPicker}
                >
                  <Text style={styles.rowLabel}>End Date</Text>
                  <View style={styles.dateValueRow}>
                    <Text style={styles.dateValue}>{formatLabel(endDate)}</Text>
                    <Text style={[styles.dateChevron, endMounted && styles.dateChevronOpen]}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* End picker — always mounted, height driven by LayoutAnimation */}
                <View style={[styles.pickerWrapper, { height: endMounted ? PICKER_HEIGHT : 0 }]}>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    minimumDate={startDate}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange('end')}
                    style={{ flex: 1 }}
                  />
                </View>

                {/* Monthly Rent */}
                <View style={styles.inputBoxRow}>
                  <Text style={styles.rowLabel}>Monthly Rent ($)</Text>
                  <TextInput
                    style={styles.textInputRight}
                    keyboardType="numeric"
                    value={monthlyRent}
                    onChangeText={setMonthlyRent}
                    returnKeyType="next"
                  />
                </View>

                {/* Security Deposit */}
                <View style={styles.inputBoxRow}>
                  <Text style={styles.rowLabel}>Security Deposit ($)</Text>
                  <TextInput
                    style={styles.textInputRight}
                    keyboardType="numeric"
                    value={securityDeposit}
                    onChangeText={setSecurityDeposit}
                    returnKeyType="done"
                  />
                </View>

                {/* ── Tenant & Contract Photos ── */}
                <Text style={styles.label}>Attachments & Photos</Text>
                
                <View style={styles.photoRow}>
                  <View style={styles.photoInfo}>
                    <Text style={styles.rowLabel}>Tenant Photo</Text>
                    <Text style={styles.photoStatus}>
                      {tenantPhoto ? '✅ Captured' : '❌ Missing'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoCaptureBtn}
                    onPress={() => {
                      setCameraMode('tenant');
                      setIsCameraVisible(true);
                    }}
                  >
                    <Text style={styles.photoCaptureText}>Capture</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.photoRow}>
                  <View style={styles.photoInfo}>
                    <Text style={styles.rowLabel}>Signed Contract</Text>
                    <Text style={styles.photoStatus}>
                      {contractPhoto ? '✅ Captured' : '❌ Missing'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoCaptureBtn}
                    onPress={() => {
                      setCameraMode('contract');
                      setIsCameraVisible(true);
                    }}
                  >
                    <Text style={styles.photoCaptureText}>Capture</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom spacer — already handled by paddingBottom on contentContainerStyle */}
              </ScrollView>
          </View>

          {/* ── Simulated Camera Viewfinder Modal (Nested to render on top on iOS) ── */}
          <Modal visible={isCameraVisible} animationType="slide" transparent>
            <SafeAreaView style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity onPress={() => setIsCameraVisible(false)}>
                  <Text style={styles.cameraCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  {cameraMode === 'tenant' ? 'Capture Tenant Photo' : 'Capture Contract Document'}
                </Text>
                <View style={{ width: 50 }} />
              </View>

              {/* Viewfinder simulation */}
              <View style={styles.viewfinder}>
                <View style={styles.scanTarget} />
                <Text style={styles.cameraInstructions}>
                  {cameraMode === 'tenant' ? 'Align tenant face inside the target frame' : 'Align contract sheet inside the target frame'}
                </Text>
              </View>

              {/* Camera controls */}
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.shutterButton}
                  onPress={() => {
                    const mockUrl = cameraMode === 'tenant' 
                      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' 
                      : 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300';
                    
                    if (cameraMode === 'tenant') setTenantPhoto(mockUrl);
                    else setContractPhoto(mockUrl);

                    Vibration.vibrate(100);
                    Alert.alert('Photo Captured', 'Document snapshot has been attached to this lease agreement.');
                    setIsCameraVisible(false);
                  }}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        </View>
      </Modal>

      <BillingConfigModal
        visible={isConfigVisible}
        onClose={() => setIsConfigVisible(false)}
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
    fontSize: 16
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  configActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  configActionText: {
    fontSize: 16
  },
  addBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF1A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remindBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF95001A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  remindBtnText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '700'
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F2F2F7',
    gap: 8
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#E5E5EA'
  },
  filterTabActive: {
    backgroundColor: '#007AFF'
  },
  filterTabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '700'
  },
  filterTabTextActive: {
    color: '#FFF'
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
    padding: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  details: {
    flex: 1
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  tenantName: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2
  },
  dueDate: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 4
  },
  values: {
    alignItems: 'flex-end',
    gap: 6
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    height: '92%',
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
  pickerBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8
  },
  selectionRow: {
    flexDirection: 'row'
  },
  selectItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    marginRight: 8
  },
  selectItemActive: {
    backgroundColor: '#007AFF'
  },
  selectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93'
  },
  selectTextActive: {
    color: '#FFF'
  },
  inputBoxRow: {
    flexDirection: 'row',
    minHeight: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateChevron: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '300',
    transform: [{ rotate: '90deg' }]
  },
  dateChevronOpen: {
    transform: [{ rotate: '-90deg' }]
  },
  // Wrapper that animates height — must clip children while collapsing
  pickerWrapper: {
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  textInputRight: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
    width: 120,
    textAlign: 'right'
  },
  photoRow: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  photoInfo: {
    justifyContent: 'center'
  },
  photoStatus: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2
  },
  photoCaptureBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  photoCaptureText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700'
  },
  // Camera Modal Styles
  cameraOverlay: {
    flex: 1,
    backgroundColor: '#000'
  },
  cameraHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  cameraCancel: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600'
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  viewfinder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#34C759',
    borderRadius: 16,
    borderStyle: 'dashed'
  },
  cameraInstructions: {
    position: 'absolute',
    bottom: 24,
    color: '#AEAEB2',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32
  },
  cameraControls: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center'
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF'
  }
});
