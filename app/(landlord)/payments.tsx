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
  Vibration,
  ActionSheetIOS,
  Linking
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Database, Property, Tenant, Lease, Payment } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { BillingConfigModal } from '../../components/BillingConfigModal';
import { formatVND } from '../../services/CurrencyUtils';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
 
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
  const { local, language } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const params = useLocalSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Filtering — only All / Paid / Pending (no Overdue)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

  // Tenant payment history modal
  const [historyTenantId, setHistoryTenantId] = useState<string | null>(null);

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

  // Camera states
  const [tenantPhoto, setTenantPhoto] = useState<string | undefined>(undefined);
  const [contractPhoto, setContractPhoto] = useState<string | undefined>(undefined);

  const handleAttachmentSelection = async (mode: 'tenant' | 'contract') => {
    const launchCamera = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to capture photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: mode === 'tenant' ? [1, 1] : [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (mode === 'tenant') setTenantPhoto(uri);
        else setContractPhoto(uri);
        Vibration.vibrate(100);
      }
    };

    const launchLibrary = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: mode === 'tenant' ? [1, 1] : [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (mode === 'tenant') setTenantPhoto(uri);
        else setContractPhoto(uri);
        Vibration.vibrate(100);
      }
    };

    const launchFilePicker = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true
        });
        if (!result.canceled && result.assets.length > 0) {
          const uri = result.assets[0].uri;
          if (mode === 'tenant') setTenantPhoto(uri);
          else setContractPhoto(uri);
          Vibration.vibrate(100);
        }
      } catch (err) {
        console.log('Document pick error: ', err);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Photo Library', 'Browse Files'],
          cancelButtonIndex: 0
        },
        (buttonIndex: number) => {
          if (buttonIndex === 1) launchCamera();
          else if (buttonIndex === 2) launchLibrary();
          else if (buttonIndex === 3) launchFilePicker();
        }
      );
    } else {
      Alert.alert(
        'Select Attachment Source',
        'Choose how you want to upload the document:',
        [
          { text: 'Take Photo', onPress: launchCamera },
          { text: 'Photo Library', onPress: launchLibrary },
          { text: 'Browse Files', onPress: launchFilePicker },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

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
    // Step 1: Confirm dialog (in Vietnamese as requested)
    Alert.alert(
      local('remind_confirm_title'),
      local('remind_confirm_msg'),
      [
        { text: local('cancel'), style: 'cancel' },
        {
          text: local('remind_confirm_btn'),
          onPress: () => {
            // Step 2: open Zalo then show success
            Linking.openURL(`https://zalo.me/${info.tenantPhone || '0901234567'}`).catch(() => {});
            setTimeout(() => {
              Alert.alert(
                local('reminder_sent_title'),
                local('reminder_sent_msg')
              );
            }, 500);
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
      local('record_paid_title'),
      local('record_paid_msg'),
      [
        { text: local('cancel'), style: 'cancel' },
        { text: local('record_paid_btn'), onPress: () => { Database.recordPaymentReceived(id); } }
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
      tenantPhone: tenant ? tenant.phone : undefined,
      tenantId: tenant ? tenant.id : undefined,
      dueDate: pay.dueDate,
      amount: pay.amount,
      status: pay.status
    };
  };

  // Sorted newest-first, filtered by status
  const filteredPayments = payments
    .filter(p => selectedStatusFilter === 'All' || p.status === selectedStatusFilter)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  // Build list items with month dividers injected
  type ListItem = { type: 'payment'; data: Payment } | { type: 'divider'; label: string };
  const listItemsWithDividers: ListItem[] = [];
  let lastMonth = '';
  for (const p of filteredPayments) {
    const d = new Date(p.dueDate);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthKey !== lastMonth) {
      lastMonth = monthKey;
      const label = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
      listItemsWithDividers.push({ type: 'divider', label });
    }
    listItemsWithDividers.push({ type: 'payment', data: p });
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Paid':    return { bg: '#34C75926', text: '#34C759' };
      case 'Overdue': return { bg: '#FF3B3026', text: '#FF3B30' };
      default:        return { bg: '#FF950026', text: '#FF9500' };
    }
  };

  // All payments for a given tenant (for history modal)
  const getTenantPaymentHistory = (tenantId: string) => {
    const tenantLeaseIds = leases.filter(l => l.tenantId === tenantId).map(l => l.id);
    return payments
      .filter(p => tenantLeaseIds.includes(p.leaseId))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>{local('payments_leases')}</Text>
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

      {/* Filter Tabs: All | Paid | Pending only */}
      <View style={styles.filterRow}>
        {(['All', 'Paid', 'Pending'] as const).map(f => {
          const label = f === 'All' ? local('filter_all') : f === 'Paid' ? local('filter_paid') : local('filter_pending');
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, selectedStatusFilter === f && styles.filterTabActive]}
              onPress={() => setSelectedStatusFilter(f)}
            >
              <Text style={[styles.filterTabText, selectedStatusFilter === f && styles.filterTabTextActive, { fontSize: adjustSize(13) }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payments List with month dividers */}
      <FlatList
        data={listItemsWithDividers}
        keyExtractor={(item, index) => item.type === 'divider' ? `div-${index}` : item.data.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={[styles.emptyTitle, { fontSize: adjustSize(16) }]}>{local('no_payments')}</Text>
            <Text style={[styles.emptyDesc, { fontSize: adjustSize(13) }]}>{local('no_payments_for_filter')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === 'divider') {
            return (
              <View style={styles.monthDivider}>
                <View style={styles.monthDividerLine} />
                <Text style={[styles.monthDividerLabel, { fontSize: adjustSize(11) }]}>{item.label}</Text>
                <View style={styles.monthDividerLine} />
              </View>
            );
          }
          const pay = item.data;
          const info = getPaymentDisplayData(pay);
          const colors = getStatusStyles(pay.status);
          const statusLabel = pay.status === 'Paid' ? local('filter_paid') : local('filter_pending');
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => info.tenantId ? setHistoryTenantId(info.tenantId) : null}
              activeOpacity={0.85}
            >
              <View style={styles.details}>
                <Text style={[styles.propertyName, { fontSize: adjustSize(15) }]}>{info.propertyName}</Text>
                <Text style={[styles.tenantName, { fontSize: adjustSize(12) }]}>{local('tenant_label')} {info.tenantName}</Text>
                <Text style={[styles.dueDate, { fontSize: adjustSize(12) }]}>{local('due_label')} {pay.dueDate}</Text>
              </View>
              <View style={styles.values}>
                <Text style={[styles.amount, { fontSize: adjustSize(14) }]}>{formatVND(info.amount)}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Status badge — tappable to mark paid if pending */}
                  {pay.status !== 'Paid' ? (
                    <TouchableOpacity
                      style={[styles.statusBadge, { backgroundColor: colors.bg }]}
                      onPress={() => handleRecordPaid(pay.id)}
                    >
                      <Text style={[styles.statusText, { color: colors.text, fontSize: adjustSize(11) }]}>
                        {statusLabel}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.text, fontSize: adjustSize(11) }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  )}
                  {/* Remind button — only for non-Paid */}
                  {pay.status !== 'Paid' && (
                    <TouchableOpacity
                      style={styles.remindBtn}
                      onPress={() => handleSendManualReminder(pay)}
                    >
                      <Text style={[styles.remindBtnText, { fontSize: adjustSize(11) }]}>🔔 Zalo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── Tenant Payment History Modal ─── */}
      <Modal visible={!!historyTenantId} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setHistoryTenantId(null)}>
                <Text style={styles.modalCancel}>{local('close')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{local('payment_history')}</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              {historyTenantId && (() => {
                const tenant = tenants.find(t => t.id === historyTenantId);
                const hist = getTenantPaymentHistory(historyTenantId);
                let lastM = '';
                return (
                  <>
                    <Text style={[styles.label, { marginBottom: 12, color: '#8E8E93' }]}>
                      {tenant?.name}
                    </Text>
                    {hist.length === 0 ? (
                      <Text style={styles.emptyDesc}>{local('no_payment_history')}</Text>
                    ) : hist.map((p, idx) => {
                      const d = new Date(p.dueDate);
                      const mk = `${d.getFullYear()}-${d.getMonth()}`;
                      const showDiv = mk !== lastM;
                      if (showDiv) lastM = mk;
                      const mLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
                      const lease = leases.find(l => l.id === p.leaseId);
                      const prop = lease ? properties.find(pr => pr.id === lease.propertyId) : null;
                      const sc = getStatusStyles(p.status);
                      return (
                        <React.Fragment key={`hist-frag-${p.id}`}>
                          {showDiv && (
                            <View key={`div-${idx}`} style={styles.monthDivider}>
                              <View style={styles.monthDividerLine} />
                              <Text style={styles.monthDividerLabel}>{mLabel}</Text>
                              <View style={styles.monthDividerLine} />
                            </View>
                          )}
                          <View key={p.id} style={[styles.card, { marginHorizontal: 0, marginBottom: 8 }]}>
                            <View style={styles.details}>
                              <Text style={styles.propertyName}>{prop?.name || 'Phòng'}</Text>
                              <Text style={styles.dueDate}>{local('due_label')} {p.dueDate}</Text>
                            </View>
                            <View style={styles.values}>
                              <Text style={styles.amount}>{formatVND(p.amount)}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                <Text style={[styles.statusText, { color: sc.text }]}>
                                  {p.status === 'Paid' ? local('filter_paid') : local('filter_pending')}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </React.Fragment>
                      );
                    })}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                    <Text style={[styles.photoStatus, { color: tenantPhoto ? '#34C759' : '#FF3B30' }]}>
                      {tenantPhoto ? 'Uploaded' : 'Missing'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoCaptureBtn}
                    onPress={() => handleAttachmentSelection('tenant')}
                  >
                    <Text style={styles.photoCaptureText}>Upload</Text>
                  </TouchableOpacity>
                </View>
 
                <View style={styles.photoRow}>
                  <View style={styles.photoInfo}>
                    <Text style={styles.rowLabel}>Signed Contract</Text>
                    <Text style={[styles.photoStatus, { color: contractPhoto ? '#34C759' : '#FF3B30' }]}>
                      {contractPhoto ? 'Uploaded' : 'Missing'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoCaptureBtn}
                    onPress={() => handleAttachmentSelection('contract')}
                  >
                    <Text style={styles.photoCaptureText}>Upload</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom spacer — already handled by paddingBottom on contentContainerStyle */}
              </ScrollView>
          </View>

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
  monthDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 8
  },
  monthDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA'
  },
  monthDividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5
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
