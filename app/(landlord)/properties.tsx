//
//  properties.tsx
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
  Animated,
  ActionSheetIOS,
  Platform,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Database, Property, PropertyType, Lease, Tenant, KhuTro, CustomFee, getLeaseContractPhotos } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { useRouter } from 'expo-router';
import { formatVND } from '../../services/CurrencyUtils';

const CONTRACT_PAGE_WIDTH = Dimensions.get('window').width - 32;

export default function LandlordProperties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [khuTros, setKhuTros] = useState<KhuTro[]>([]);

  // Modals
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [isKhuModalVisible, setIsKhuModalVisible] = useState(false);
  // Unified room detail modal (stats + payment history + occupant + prices + contract)
  const [historyProperty, setHistoryProperty] = useState<Property | null>(null);

  // Price details edit state (populated from historyProperty when the detail modal opens)
  const [editRent, setEditRent] = useState('');
  const [editElectric, setEditElectric] = useState('');
  const [editWater, setEditWater] = useState('');
  const [editService, setEditService] = useState('');
  const [editParking, setEditParking] = useState('');
  const [editCustomFees, setEditCustomFees] = useState<CustomFee[]>([]);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');

  // Contract pager state
  const [contractPageIndex, setContractPageIndex] = useState(0);

  // Form Fields for Room
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedKhuTroId, setSelectedKhuTroId] = useState('');

  // Form Fields for Khu
  const [newKhuName, setNewKhuName] = useState('');
  const [newKhuAddress, setNewKhuAddress] = useState('');
  const [newKhuRemindDay, setNewKhuRemindDay] = useState('');
  const [roomRemindDay, setRoomRemindDay] = useState('');

  // Dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toast notification with slide up / slide down transitions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    // Slide up and fade in
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Slide down and fade out after 2.5 seconds
    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastMessage(null);
      });
    }, 2500);
  };

  // Filtering
  const [selectedKhuFilterId, setSelectedKhuFilterId] = useState<'all' | string>('all');
  
  const { local, localF, language } = useLanguage();
  const { isEasyView, adjustSize } = useEasyViewMode();
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [rentAmount, setRentAmount] = useState('1500');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [electricityRate, setElectricityRate] = useState('3500');
  const [waterRate, setWaterRate] = useState('100000');
  const [serviceFee, setServiceFee] = useState('50000');

  const types: PropertyType[] = ['Apartment', 'House', 'Condo', 'Townhouse'];

  const refreshData = () => {
    const props = Database.getProperties();
    const activeLeases = Database.getLeases();
    const currentTenants = Database.getTenants();
    const complexes = Database.getKhuTros();

    setProperties([...props]);
    setLeases([...activeLeases]);
    setTenants([...currentTenants]);
    setKhuTros([...complexes]);

    if (complexes.length > 0 && !selectedKhuTroId) {
      setSelectedKhuTroId(complexes[0].id);
    }
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(refreshData);
    refreshData();
    return unsubscribe;
  }, []);

  const handleSave = () => {
    if (!name.trim() || !address.trim() || isNaN(Number(rentAmount))) return;

    const remindDayNum = Number(roomRemindDay);
    Database.addProperty({
      name,
      khuTroId: selectedKhuTroId,
      address,
      propertyType,
      rentAmount: Number(rentAmount),
      bedrooms,
      bathrooms,
      electricityRate: Number(electricityRate),
      waterRate: Number(waterRate),
      serviceFee: Number(serviceFee),
      remindDay: remindDayNum > 0 && remindDayNum <= 28 ? remindDayNum : undefined
    });

    // Reset Form
    setName('');
    setAddress('');
    setPropertyType('Apartment');
    setRentAmount('1500');
    setBedrooms(2);
    setBathrooms(1);
    setElectricityRate('3500');
    setWaterRate('100000');
    setServiceFee('50000');
    setRoomRemindDay('');
    setIsAddVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      local('delete_property_title'),
      local('delete_property_desc'),
      [
        { text: local('cancel'), style: 'cancel' },
        {
          text: local('delete'),
          style: 'destructive',
          onPress: () => {
            Database.deleteProperty(id);
            setHistoryProperty(null);
          }
        }
      ]
    );
  };

  const handleSaveKhu = () => {
    if (!newKhuName.trim() || !newKhuAddress.trim()) {
      Alert.alert(local('required_title'), local('khu_fields_required_desc'));
      return;
    }
    const remindDayNum = Number(newKhuRemindDay);
    Database.addKhuTro(
      newKhuName.trim(), 
      newKhuAddress.trim(), 
      remindDayNum > 0 && remindDayNum <= 28 ? remindDayNum : undefined
    );
    setNewKhuName('');
    setNewKhuAddress('');
    setNewKhuRemindDay('');
    refreshData();
    setIsKhuModalVisible(false);
    showToast(local('complex_success_desc'));
  };

  const handleDeleteKhu = (id: string) => {
    Alert.alert(
      local('delete_complex_title'),
      local('delete_complex_desc'),
      [
        { text: local('cancel'), style: 'cancel' },
        { 
          text: local('delete'), 
          style: 'destructive', 
          onPress: () => {
            Database.deleteKhuTro(id);
            if (selectedKhuFilterId === id) {
              setSelectedKhuFilterId('all');
            }
          }
        }
      ]
    );
  };

  // Get active tenant for detail view
  const getLeaseHistory = (propId: string) => {
    return leases
      .filter(l => l.propertyId === propId)
      .map(l => {
        const tenant = tenants.find(t => t.id === l.tenantId);
        return {
          ...l,
          tenantName: tenant ? tenant.name : local('unknown_tenant')
        };
      });
  };

  // Days until lease expiry for a property (returns null if no active lease)
  const getDaysToExpiry = (propId: string): number | null => {
    const activeLease = leases.find(l => l.propertyId === propId && l.status === 'active');
    if (!activeLease) return null;
    const end = new Date(activeLease.endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // All payments for a property (across all leases)
  const getRoomPaymentHistory = (propId: string) => {
    const propLeaseIds = leases.filter(l => l.propertyId === propId).map(l => l.id);
    return Database.getPayments()
      .filter(p => propLeaseIds.includes(p.leaseId))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  };

  // Current active tenant + lease for a room (null when vacant)
  const getActiveOccupant = (propId: string) => {
    const lease = leases.find(l => l.propertyId === propId && l.status === 'active');
    if (!lease) return null;
    const tenant = tenants.find(t => t.id === lease.tenantId);
    return tenant ? { tenant, lease } : null;
  };

  const typeLabel = (t: PropertyType) => {
    switch (t) {
      case 'Apartment': return local('type_apartment');
      case 'House': return local('type_house');
      case 'Condo': return local('type_condo');
      case 'Townhouse': return local('type_townhouse');
      default: return t;
    }
  };

  // Populate editable price fields whenever the detail modal opens for a room
  useEffect(() => {
    if (!historyProperty) return;
    setEditRent(String(historyProperty.rentAmount ?? ''));
    setEditElectric(String(historyProperty.electricityRate ?? ''));
    setEditWater(historyProperty.waterRate ? String(historyProperty.waterRate) : '');
    setEditService(historyProperty.serviceFee ? String(historyProperty.serviceFee) : '');
    setEditParking(historyProperty.parkingFee !== undefined ? String(historyProperty.parkingFee) : '');
    setEditCustomFees(historyProperty.customFees ? [...historyProperty.customFees] : []);
    setNewFeeName('');
    setNewFeeAmount('');
    setContractPageIndex(0);
  }, [historyProperty]);

  const handleSavePrices = () => {
    if (!historyProperty) return;
    if (!editRent.trim() || isNaN(Number(editRent)) || Number(editRent) <= 0 ||
        !editElectric.trim() || isNaN(Number(editElectric)) || Number(editElectric) <= 0) {
      Alert.alert(local('invalid_price_title'), local('invalid_price_desc'));
      return;
    }
    const updates: Partial<Property> = {
      rentAmount: Number(editRent) || 0,
      electricityRate: Number(editElectric) || 0,
      waterRate: editWater === '' ? 0 : Number(editWater) || 0,
      serviceFee: editService === '' ? 0 : Number(editService) || 0,
      parkingFee: editParking === '' ? undefined : Number(editParking) || 0,
      customFees: editCustomFees,
    };
    Database.updateProperty(historyProperty.id, updates);
    setHistoryProperty({ ...historyProperty, ...updates });
    showToast(local('save_prices'));
  };

  const handleAddCustomFee = () => {
    if (!newFeeName.trim() || !newFeeAmount.trim() || isNaN(Number(newFeeAmount)) || Number(newFeeAmount) <= 0) {
      Alert.alert(local('invalid_fee_title'), local('invalid_fee_desc'));
      return;
    }
    const fee: CustomFee = {
      id: 'fee-' + Math.random().toString(36).substring(7),
      name: newFeeName.trim(),
      amount: Number(newFeeAmount)
    };
    setEditCustomFees(prev => [...prev, fee]);
    setNewFeeName('');
    setNewFeeAmount('');
  };

  const handleRemoveCustomFee = (feeId: string) => {
    setEditCustomFees(prev => prev.filter(f => f.id !== feeId));
  };

  const handleUpdateContractPhotos = async (lease: Lease) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(local('permission_required'), local('permission_library'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri);
      Database.updateLeaseContractPhotos(lease.id, uris);
      setContractPageIndex(0);
    }
  };

  const handleContractScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = e.nativeEvent.layoutMeasurement.width || CONTRACT_PAGE_WIDTH;
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setContractPageIndex(idx);
  };

  const filteredProperties = properties.filter(
    p => selectedKhuFilterId === 'all' || p.khuTroId === selectedKhuFilterId
  );

  // When no complex filter is active, group rooms per complex and inject a divider before each group
  type RoomListItem =
    | { type: 'divider'; key: string; label: string }
    | { type: 'room'; key: string; data: Property };

  const roomListItems: RoomListItem[] = [];
  if (selectedKhuFilterId === 'all') {
    const orderedKhuIds = [
      ...khuTros.map(k => k.id),
      ...filteredProperties.map(p => p.khuTroId).filter(id => !khuTros.some(k => k.id === id))
    ];
    const seen = new Set<string>();
    orderedKhuIds.forEach(khuId => {
      if (seen.has(khuId)) return;
      seen.add(khuId);
      const rooms = filteredProperties.filter(p => p.khuTroId === khuId);
      if (rooms.length === 0) return;
      roomListItems.push({
        type: 'divider',
        key: `khu-div-${khuId}`,
        label: khuTros.find(k => k.id === khuId)?.name || local('complex')
      });
      rooms.forEach(r => roomListItems.push({ type: 'room', key: r.id, data: r }));
    });
  } else {
    filteredProperties.forEach(r => roomListItems.push({ type: 'room', key: r.id, data: r }));
  }

  const openAddMenu = () => {
    const options = [local('cancel'), local('add_menu_room'), local('add_menu_complex')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) setIsAddVisible(true);
          if (idx === 2) setIsKhuModalVisible(true);
        }
      );
    } else {
      Alert.alert(local('add_room'), undefined, [
        { text: local('add_menu_room'), onPress: () => setIsAddVisible(true) },
        { text: local('add_menu_complex'), onPress: () => setIsKhuModalVisible(true) },
        { text: local('cancel'), style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>{local('properties') || 'Properties'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={openAddMenu}
            accessibilityLabel={local('add_room')}
          >
            <Text style={[styles.addText, { fontSize: adjustSize(16) }]}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Khu Trọ Switcher Chips Row ─── */}
      <View style={styles.switcherContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
          <TouchableOpacity
            style={[styles.chip, selectedKhuFilterId === 'all' && styles.activeChip]}
            onPress={() => setSelectedKhuFilterId('all')}
          >
            <Text style={[styles.chipText, selectedKhuFilterId === 'all' && styles.activeChipText, { fontSize: adjustSize(13) }]}>
              {local('all_complexes')}
            </Text>
          </TouchableOpacity>

          {khuTros.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[styles.chip, selectedKhuFilterId === k.id && styles.activeChip]}
              onPress={() => setSelectedKhuFilterId(k.id)}
            >
              <Text style={[styles.chipText, selectedKhuFilterId === k.id && styles.activeChipText]}>
                {k.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Properties List */}
      <FlatList
        data={roomListItems}
        keyExtractor={entry => entry.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>{local('no_properties_title')}</Text>
            <Text style={styles.emptyDesc}>{local('no_properties_desc')}</Text>
          </View>
        }
        renderItem={({ item: entry }) => {
          if (entry.type === 'divider') {
            return (
              <View style={styles.khuDivider}>
                <View style={styles.khuDividerLine} />
                <Text style={[styles.khuDividerLabel, { fontSize: adjustSize(11) }]}>{entry.label}</Text>
                <View style={styles.khuDividerLine} />
              </View>
            );
          }
          const item = entry.data;
          const daysToExpiry = getDaysToExpiry(item.id);
          const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry < 30;
          const isOccupied = item.isOccupied;

          let badgeColor = isExpiringSoon ? '#FF3B30' : (isOccupied ? '#34C759' : '#FF9500');
          let badgeBg = isExpiringSoon ? '#FF3B3026' : (isOccupied ? '#34C75926' : '#FF950026');
          let badgeLabel = isExpiringSoon
            ? local('expiring_soon')
            : isOccupied ? local('occupied') : local('vacant');

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/(landlord)/room-detail',
                  params: { propertyId: item.id }
                })
              }
            >
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>
                  {item.propertyType === 'House' ? '🏡' : '🏢'}
                </Text>
              </View>

              <View style={styles.details}>
                <Text style={styles.name}>
                  {item.name} • <Text style={{ fontSize: 13, color: '#8E8E93' }}>{khuTros.find(k => k.id === item.khuTroId)?.name || 'Khu trọ'}</Text>
                </Text>
                <Text style={styles.address}>{item.address}</Text>
              </View>

              <View style={styles.values}>
                <Text style={styles.rent}>{formatVND(item.rentAmount)}</Text>
                {isExpiringSoon && daysToExpiry !== null && (
                  <Text style={{ fontSize: 10, color: '#FF3B30', marginBottom: 2 }}>
                    {daysToExpiry} {local('days_remaining')}
                  </Text>
                )}
                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.statusText, { color: badgeColor }]}>
                    {badgeLabel}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ─── Room Payment History Modal ─── */}
      <Modal
        visible={!!historyProperty}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryProperty(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setHistoryProperty(null)}>
                <Text style={styles.modalCancel}>{local('close')}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: adjustSize(17) }]}>
                {historyProperty?.name}
              </Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Room info */}
              {historyProperty && (
                <>
                  <Text style={[styles.label, { fontSize: adjustSize(13), marginTop: 0 }]}>{local('room_info')}</Text>
                  <View style={styles.detailContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('belongs_to_complex')}</Text>
                      <Text style={styles.detailValue}>
                        {khuTros.find(k => k.id === historyProperty.khuTroId)?.name || local('dash_empty')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('address_label')}</Text>
                      <Text style={styles.detailValue}>{historyProperty.address}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('property_type_label')}</Text>
                      <Text style={styles.detailValue}>{typeLabel(historyProperty.propertyType)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('bedrooms_label')}</Text>
                      <Text style={styles.detailValue}>{historyProperty.bedrooms}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('bathrooms_label')}</Text>
                      <Text style={styles.detailValue}>{historyProperty.bathrooms}</Text>
                    </View>
                    {historyProperty.remindDay !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{local('remind_day_label')}</Text>
                        <Text style={styles.detailValue}>
                          {localF('remind_day_value', { day: historyProperty.remindDay })}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('status_label')}</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: historyProperty.isOccupied ? '#34C759' : '#FF9500', fontWeight: '700' }
                        ]}
                      >
                        {historyProperty.isOccupied ? local('occupied') : local('vacant')}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Quick stats */}
              {historyProperty && (() => {
                const daysToExpiry = getDaysToExpiry(historyProperty.id);
                const isExpiring = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry < 30;
                return (
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={[styles.label, { fontSize: adjustSize(13), marginBottom: 0 }]}>
                        {local('monthly_rent_label')}
                      </Text>
                      <Text style={[styles.label, { fontSize: adjustSize(13), marginBottom: 0, color: '#007AFF' }]}>
                        {formatVND(historyProperty.rentAmount)}
                      </Text>
                    </View>
                    {isExpiring && daysToExpiry !== null && (
                      <View style={{ backgroundColor: '#FF3B3015', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                        <Text style={{ color: '#FF3B30', fontSize: adjustSize(13), fontWeight: '600' }}>
                          ⚠️ {local('expiring_soon')} — {daysToExpiry} {local('days_remaining')}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('room_payment_history')}</Text>
              {historyProperty && (() => {
                const hist = getRoomPaymentHistory(historyProperty.id);
                if (hist.length === 0) {
                  return (
                    <View style={styles.emptyLease}>
                      <Text style={styles.emptyLeaseText}>{local('no_leases_for_room')}</Text>
                    </View>
                  );
                }
                let lastM = '';
                return hist.map((p, idx) => {
                  const d = new Date(p.dueDate);
                  const mk = `${d.getFullYear()}-${d.getMonth()}`;
                  const showDiv = mk !== lastM;
                  if (showDiv) lastM = mk;
                  const mLabel = d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
                  const lease = leases.find(l => l.id === p.leaseId);
                  const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
                  const isPaid = p.status === 'Paid';
                  return (
                    <React.Fragment key={`hist-frag-${p.id}`}>
                      {showDiv && (
                        <View key={`div-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 8 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                          <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase' }}>{mLabel}</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5EA' }} />
                        </View>
                      )}
                      <View style={[styles.khuListItem, { marginBottom: 8 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.khuListName, { fontSize: adjustSize(14) }]}>{p.notes || local('base_rent')}</Text>
                          <Text style={[styles.khuListAddr, { fontSize: adjustSize(12) }]}>
                            {tenant?.name || local('unknown_tenant')} • {local('due_label')} {p.dueDate}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: adjustSize(14), fontWeight: '700', color: '#1C1C1E' }}>
                            {formatVND(p.amount)}
                          </Text>
                          <View style={{ backgroundColor: isPaid ? '#34C75926' : '#FF950026', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 }}>
                            <Text style={{ fontSize: 11, color: isPaid ? '#34C759' : '#FF9500', fontWeight: '700' }}>
                              {isPaid ? local('filter_paid') : local('filter_pending')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </React.Fragment>
                  );
                });
              })()}

              {/* Occupant */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('occupant_section')}</Text>
              {historyProperty && (() => {
                const occ = getActiveOccupant(historyProperty.id);
                if (!occ) {
                  return (
                    <View style={styles.emptyLease}>
                      <Text style={styles.emptyLeaseText}>{local('no_occupant')}</Text>
                    </View>
                  );
                }
                const { tenant } = occ;
                return (
                  <View style={styles.detailContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      {tenant.photoUri ? (
                        <Image source={{ uri: tenant.photoUri }} style={styles.occupantAvatar} />
                      ) : (
                        <View style={[styles.occupantAvatar, styles.occupantAvatarFallback]}>
                          <Text style={styles.occupantAvatarInitial}>{tenant.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: adjustSize(16), fontWeight: '700', color: '#1C1C1E' }}>{tenant.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('phone_number')}</Text>
                      <Text style={styles.detailValue}>{tenant.phone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('zalo_number')}</Text>
                      <Text style={styles.detailValue}>{tenant.zalo || local('dash_empty')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{local('email_label')}</Text>
                      <Text style={styles.detailValue}>{tenant.email || local('dash_empty')}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Lease History */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('lease_history')}</Text>
              {historyProperty && (() => {
                const hist = getLeaseHistory(historyProperty.id);
                if (hist.length === 0) {
                  return (
                    <View style={styles.emptyLease}>
                      <Text style={styles.emptyLeaseText}>{local('no_leases_for_room')}</Text>
                    </View>
                  );
                }
                return (
                  <View style={styles.leaseContainer}>
                    {hist.map(lease => (
                      <View key={lease.id} style={styles.leaseRow}>
                        <Text style={styles.leaseTenant}>{lease.tenantName}</Text>
                        <Text style={styles.leaseDates}>{lease.startDate} — {lease.endDate}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {/* Price details */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('price_details')}</Text>
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('base_rent_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={editRent}
                  onChangeText={setEditRent}
                />
              </View>
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('electricity_rate_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={editElectric}
                  onChangeText={setEditElectric}
                />
              </View>
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('water_rate_optional')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={editWater}
                  onChangeText={setEditWater}
                  placeholder={local('dash_empty')}
                />
              </View>
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('service_fee_optional')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={editService}
                  onChangeText={setEditService}
                  placeholder={local('dash_empty')}
                />
              </View>
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('parking_fee_optional')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={editParking}
                  onChangeText={setEditParking}
                  placeholder={local('dash_empty')}
                />
              </View>

              {editCustomFees.map(fee => (
                <View key={fee.id} style={styles.inputBoxRow}>
                  <Text style={styles.rowLabel} numberOfLines={1}>{fee.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.numberInput}>{formatVND(fee.amount)}</Text>
                    <TouchableOpacity onPress={() => handleRemoveCustomFee(fee.id)} hitSlop={8}>
                      <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 }}>
                <View style={[styles.inputBox, { flex: 1.4, marginBottom: 0 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={local('custom_fee_name')}
                    placeholderTextColor="#8E8E93"
                    value={newFeeName}
                    onChangeText={setNewFeeName}
                  />
                </View>
                <View style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={local('custom_fee_amount')}
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={newFeeAmount}
                    onChangeText={setNewFeeAmount}
                  />
                </View>
                <TouchableOpacity style={styles.addFeeBtn} onPress={handleAddCustomFee}>
                  <Text style={styles.addFeeBtnText}>＋</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: '#8E8E93', marginBottom: 12 }}>{local('add_custom_fee')}</Text>

              <TouchableOpacity style={styles.addKhuSubmitBtn} onPress={handleSavePrices}>
                <Text style={styles.addKhuSubmitText}>{local('save_prices')}</Text>
              </TouchableOpacity>

              {/* Contract */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('rental_agreement')}</Text>
              {historyProperty && (() => {
                const occ = getActiveOccupant(historyProperty.id);
                if (!occ) {
                  return (
                    <View style={styles.emptyLease}>
                      <Text style={styles.emptyLeaseText}>{local('no_occupant')}</Text>
                    </View>
                  );
                }
                const photos = getLeaseContractPhotos(occ.lease);
                return (
                  <View>
                    {photos.length === 0 ? (
                      <View style={styles.emptyLease}>
                        <Text style={styles.emptyLeaseText}>{local('no_contract_photo')}</Text>
                      </View>
                    ) : (
                      <>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onMomentumScrollEnd={handleContractScrollEnd}
                          style={styles.contractPager}
                        >
                          {photos.map((uri, idx) => (
                            <Image
                              key={`contract-${idx}`}
                              source={{ uri }}
                              style={styles.contractPhoto}
                              resizeMode="cover"
                            />
                          ))}
                        </ScrollView>
                        <Text style={styles.contractPageText}>
                          {localF('contract_page_indicator', { current: contractPageIndex + 1, total: photos.length })}
                        </Text>
                      </>
                    )}
                    {occ.lease.contractUpdatedAt && (
                      <Text style={styles.contractUpdatedText}>
                        {localF('contract_last_updated', {
                          date: new Date(occ.lease.contractUpdatedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
                        })}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.addKhuSubmitBtn, { marginTop: 12 }]}
                      onPress={() => handleUpdateContractPhotos(occ.lease)}
                    >
                      <Text style={styles.addKhuSubmitText}>{local('update_contract_photos')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* Actions */}
              {historyProperty && !historyProperty.isOccupied && (
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: '#007AFF1A', marginBottom: 12, marginTop: 32 }]}
                  onPress={() => {
                    const propId = historyProperty.id;
                    setHistoryProperty(null);
                    router.push({
                      pathname: '/(landlord)/create-lease',
                      params: { propertyId: propId }
                    });
                  }}
                >
                  <Text style={[styles.deleteBtnText, { color: '#007AFF' }]}>{local('assign_tenant_action')}</Text>
                </TouchableOpacity>
              )}

              {historyProperty && (
                <TouchableOpacity
                  style={[styles.deleteBtn, historyProperty.isOccupied && { marginTop: 32 }]}
                  onPress={() => handleDelete(historyProperty.id)}
                >
                  <Text style={styles.deleteBtnText}>{local('delete_property_action')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── local('manage_complexes_title') ─── */}
      <Modal
        visible={isKhuModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsKhuModalVisible(false)}
      >

        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsKhuModalVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: adjustSize(17) }]}>{local('manage_complexes')}</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              
              {/* Add Khu Form */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('add_complex')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(15) }]}
                  placeholder={local('complex_name')}
                  placeholderTextColor="#8E8E93"
                  value={newKhuName}
                  onChangeText={setNewKhuName}
                />
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(15) }]}
                  placeholder={local('complex_address')}
                  placeholderTextColor="#8E8E93"
                  value={newKhuAddress}
                  onChangeText={setNewKhuAddress}
                />
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(15) }]}
                  placeholder={local('remind_day_khu_optional_label')}
                  placeholderTextColor="#8E8E93"
                  value={newKhuRemindDay}
                  onChangeText={setNewKhuRemindDay}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <TouchableOpacity style={styles.addKhuSubmitBtn} onPress={handleSaveKhu}>
                <Text style={[styles.addKhuSubmitText, { fontSize: adjustSize(14) }]}>{local('add_complex')}</Text>
              </TouchableOpacity>

              <View style={styles.configDivider} />

              {/* Lists of existing complexes */}
              <Text style={[styles.label, { fontSize: adjustSize(13) }]}>{local('current_complexes')}</Text>
              {khuTros.length === 0 ? (
                <View style={styles.emptyLease}>
                  <Text style={styles.emptyLeaseText}>{local('no_complexes_created')}</Text>
                </View>
              ) : (
                <View style={styles.khuListContainer}>
                  {khuTros.map(k => (
                    <View key={k.id} style={styles.khuListItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.khuListName}>{k.name}</Text>
                        <Text style={styles.khuListAddr}>{k.address}</Text>
                        {k.remindDay !== undefined && (
                          <Text style={[styles.khuListAddr, { color: '#007AFF', fontWeight: '600', marginTop: 2 }]}>
                            📅 {local('remind_day_label')}: {localF('remind_day_value', { day: k.remindDay })}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity style={styles.khuListDeleteBtn} onPress={() => handleDeleteKhu(k.id)}>
                        <Text style={[styles.khuListDeleteText, { fontSize: adjustSize(12) }]}>{local('delete')}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Property Modal */}
      <Modal 
        visible={isAddVisible} 
        animationType="slide" 
        transparent
        onRequestClose={() => setIsAddVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: adjustSize(17) }]}>{local('add_room') || 'Add Room'}</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!name.trim() || !address.trim()}
                style={(!name.trim() || !address.trim()) && { opacity: 0.5 }}
              >
                <Text style={styles.modalSave}>{local('save') || 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Parent Khu selector (Dropdown) */}
              <Text style={styles.label}>{local('select_complex_label')}</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdownTrigger} 
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Text style={styles.dropdownTriggerText}>
                    {khuTros.find(k => k.id === selectedKhuTroId)?.name || 'Select Complex'}
                  </Text>
                  <Text style={styles.dropdownChevron}>{isDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView 
                      style={{ maxHeight: 150 }} 
                      nestedScrollEnabled
                      contentContainerStyle={{ paddingVertical: 4 }}
                    >
                      {khuTros.map(k => (
                        <TouchableOpacity
                          key={k.id}
                          style={[
                            styles.dropdownItem,
                            selectedKhuTroId === k.id && styles.dropdownItemActive
                          ]}
                          onPress={() => {
                            setSelectedKhuTroId(k.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            selectedKhuTroId === k.id && styles.dropdownItemTextActive
                          ]}>
                            {k.name}
                          </Text>
                          {selectedKhuTroId === k.id && (
                            <Text style={styles.checkIcon}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.label}>{local('general_information')}</Text>
              
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder={local('property_name_placeholder')}
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder={local('address_placeholder')}
                  placeholderTextColor="#8E8E93"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Picker for Property Type */}
              <Text style={styles.label}>{local('property_type_label')}</Text>
              <View style={styles.segmentedContainer}>
                {types.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.segmentButton,
                      propertyType === t && { backgroundColor: '#007AFF' }
                    ]}
                    onPress={() => setPropertyType(t)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        propertyType === t && { color: '#FFF', fontWeight: '700' }
                      ]}
                    >
                      {typeLabel(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{local('financials_size_label')}</Text>
              
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('monthly_rent_room_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('electricity_kwh_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={electricityRate}
                  onChangeText={setElectricityRate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('water_monthly_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={waterRate}
                  onChangeText={setWaterRate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('service_fee_room_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={serviceFee}
                  onChangeText={setServiceFee}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>{local('remind_day_optional_label')}</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={roomRemindDay}
                  onChangeText={setRoomRemindDay}
                  maxLength={2}
                />
              </View>

              {/* Bedroom Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.rowLabel}>{localF('bedrooms_count_label', { count: bedrooms })}</Text>
                <View style={styles.stepperButtons}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBedrooms(Math.max(1, bedrooms - 1))}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBedrooms(Math.min(10, bedrooms + 1))}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bathroom Stepper */}
              <View style={styles.stepperRow}>
                <Text style={styles.rowLabel}>{localF('bathrooms_count_label', { count: bathrooms })}</Text>
                <View style={styles.stepperButtons}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBathrooms(Math.max(1, bathrooms - 1))}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBathrooms(Math.min(10, bathrooms + 1))}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {toastMessage !== null && (
        <Animated.View 
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0]
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    minHeight: 68,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8
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
  listContent: {
    padding: 16,
    gap: 12
  },
  khuDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4
  },
  khuDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C7C7CC'
  },
  khuDividerLabel: {
    color: '#8E8E93',
    fontWeight: '800',
    textTransform: 'uppercase'
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#007AFF1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  iconText: {
    fontSize: 22
  },
  details: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  address: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2
  },
  values: {
    alignItems: 'flex-end',
    gap: 4
  },
  rent: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E'
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
    color: '#007AFF',
    fontWeight: '600'
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
  inputBoxRow: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  textInput: {
    fontSize: 15,
    color: '#1C1C1E'
  },
  numberInput: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '700',
    width: 80,
    textAlign: 'right'
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 2,
    marginBottom: 16
  },
  segmentButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  segmentText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600'
  },
  stepperRow: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  stepperButtons: {
    flexDirection: 'row',
    gap: 8
  },
  stepperBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF'
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
  leaseTenant: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  addBtnHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF1A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Switcher styles
  switcherContainer: {
    height: 48,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    marginBottom: 8
  },
  switcherScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  activeChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93'
  },
  activeChipText: {
    color: '#FFF'
  },
  // Khu list CRUD modal
  addKhuSubmitBtn: {
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  addKhuSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
  },
  configDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 20
  },
  khuListContainer: {
    gap: 12
  },
  khuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between'
  },
  khuListName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  khuListAddr: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2
  },
  khuListDeleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B301A',
    borderRadius: 8
  },
  khuListDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30'
  },
  toastContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#323232',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 9999
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 12
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16
  },
  dropdownTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  dropdownChevron: {
    fontSize: 12,
    color: '#8E8E93'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 4,
    maxHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 2000
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  dropdownItemActive: {
    backgroundColor: '#007AFF10'
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1C1C1E'
  },
  dropdownItemTextActive: {
    color: '#007AFF',
    fontWeight: '700'
  },
  checkIcon: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700'
  },
  // Occupant avatar
  occupantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28
  },
  occupantAvatarFallback: {
    backgroundColor: '#007AFF1A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  occupantAvatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF'
  },
  // Custom fee add row
  addFeeBtn: {
    width: 44,
    height: 48,
    backgroundColor: '#007AFF1A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addFeeBtnText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '700'
  },
  // Contract pager
  contractPager: {
    height: 220,
    borderRadius: 16
  },
  contractPhoto: {
    width: CONTRACT_PAGE_WIDTH,
    height: 220,
    borderRadius: 16,
    backgroundColor: '#F2F2F7'
  },
  contractPageText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600'
  },
  contractUpdatedText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  }
});
