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
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, Property, PropertyType, Lease, Tenant, KhuTro } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { useRouter } from 'expo-router';
import { formatVND } from '../../services/CurrencyUtils';

export default function LandlordProperties() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [khuTros, setKhuTros] = useState<KhuTro[]>([]);

  // Modals
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isKhuModalVisible, setIsKhuModalVisible] = useState(false);
  // Room payment history modal
  const [historyProperty, setHistoryProperty] = useState<Property | null>(null);

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
  
  const { local, language } = useLanguage();
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
      'Delete Property',
      'Are you sure you want to delete this property? This will also remove any linked leases and payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Database.deleteProperty(id);
            setSelectedProperty(null);
          }
        }
      ]
    );
  };

  const handleSaveKhu = () => {
    if (!newKhuName.trim() || !newKhuAddress.trim()) {
      Alert.alert(
        language === 'vi' ? 'Yêu cầu' : 'Required',
        language === 'vi' ? 'Vui lòng điền đầy đủ cả hai trường tên và địa chỉ.' : 'Both fields (complex name and address) are required.'
      );
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
      'Xóa Khu Trọ',
      'Xóa khu trọ này sẽ đồng thời xóa toàn bộ các phòng và hợp đồng nằm trong khu. Bạn có chắc muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
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
          tenantName: tenant ? tenant.name : 'Unknown Tenant'
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

  const filteredProperties = properties.filter(
    p => selectedKhuFilterId === 'all' || p.khuTroId === selectedKhuFilterId
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>{local('properties') || 'Properties'}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.khuManageBtn} 
            onPress={() => setIsKhuModalVisible(true)}
            accessibilityLabel={local('manage_complexes')}
          >
            <Text style={[styles.khuManageText, { fontSize: adjustSize(16) }]}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addBtnHeader} 
            onPress={() => setIsAddVisible(true)}
            accessibilityLabel={local('add_room') || 'Add Room'}
          >
            <Text style={[styles.addText, { fontSize: adjustSize(16) }]}>➕</Text>
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
        data={filteredProperties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No Properties</Text>
            <Text style={styles.emptyDesc}>Add your first rental property to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const daysToExpiry = getDaysToExpiry(item.id);
          const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry < 30;
          const isOccupied = item.isOccupied;

          let badgeColor = isExpiringSoon ? '#FF3B30' : (isOccupied ? '#34C759' : '#FF9500');
          let badgeBg = isExpiringSoon ? '#FF3B3026' : (isOccupied ? '#34C75926' : '#FF950026');
          let badgeLabel = isExpiringSoon
            ? local('expiring_soon')
            : isOccupied ? local('occupied') : local('vacant');

          return (
            <TouchableOpacity style={styles.card} onPress={() => setHistoryProperty(item)}>
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
              {/* Edit property button */}
              <TouchableOpacity onPress={() => {
                setSelectedProperty(historyProperty);
                setHistoryProperty(null);
              }}>
                <Text style={styles.modalSave}>✏️</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
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
                          <Text style={[styles.khuListName, { fontSize: adjustSize(14) }]}>{p.notes || 'Tiền phòng'}</Text>
                          <Text style={[styles.khuListAddr, { fontSize: adjustSize(12) }]}>
                            {tenant?.name || 'Không rõ'} • Hạn: {p.dueDate}
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
                  placeholder="Ngày nhắc phí khu trọ (1-28, optional)"
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
                            📅 Ngày nhắc: Ngày {k.remindDay} hàng tháng
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

              <Text style={styles.label}>General Information</Text>
              
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Property Name (e.g. Oakridge Apt 4B)"
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Address"
                  placeholderTextColor="#8E8E93"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Picker for Property Type */}
              <Text style={styles.label}>Property Type</Text>
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
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Financials & Size</Text>
              
              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Monthly Rent ($)</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Electricity (kWh)</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={electricityRate}
                  onChangeText={setElectricityRate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Water (Monthly)</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={waterRate}
                  onChangeText={setWaterRate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Service Fee</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={serviceFee}
                  onChangeText={setServiceFee}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Remind Day (1-28, optional)</Text>
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
                <Text style={styles.rowLabel}>Bedrooms: {bedrooms}</Text>
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
                <Text style={styles.rowLabel}>Bathrooms: {bathrooms}</Text>
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

      {/* Property Detail Modal */}
      <Modal 
        visible={selectedProperty !== null} 
        animationType="slide" 
        transparent
        onRequestClose={() => setSelectedProperty(null)}
      >
        {selectedProperty && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedProperty(null)}>
                  <Text style={styles.modalCancel}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedProperty.name}</Text>
                <View style={{ width: 50 }} />
              </View>

              <ScrollView style={styles.formScroll} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.label}>Details</Text>
                <View style={styles.detailContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selectedProperty.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{selectedProperty.propertyType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rent</Text>
                    <Text style={styles.detailValue}>${selectedProperty.rentAmount.toLocaleString()}/mo</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bedrooms</Text>
                    <Text style={styles.detailValue}>{selectedProperty.bedrooms}</Text>
                  </View>
                   <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bathrooms</Text>
                    <Text style={styles.detailValue}>{selectedProperty.bathrooms}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Electricity Rate</Text>
                    <Text style={styles.detailValue}>${selectedProperty.electricityRate?.toLocaleString() || '3,500'}/kWh</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Water Rate</Text>
                    <Text style={styles.detailValue}>${selectedProperty.waterRate?.toLocaleString() || '100,000'}/mo</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service Fee</Text>
                    <Text style={styles.detailValue}>${selectedProperty.serviceFee?.toLocaleString() || '50,000'}/mo</Text>
                  </View>
                  {selectedProperty.remindDay !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Remind Day</Text>
                      <Text style={styles.detailValue}>Day {selectedProperty.remindDay} of month</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: selectedProperty.isOccupied ? '#34C759' : '#FF9500', fontWeight: '700' }
                      ]}
                    >
                      {selectedProperty.isOccupied ? 'Occupied' : 'Vacant'}
                    </Text>
                  </View>
                </View>

                {/* Lease History */}
                <Text style={styles.label}>Lease History</Text>
                {getLeaseHistory(selectedProperty.id).length === 0 ? (
                  <View style={styles.emptyLease}>
                    <Text style={styles.emptyLeaseText}>No lease logs for this property.</Text>
                  </View>
                ) : (
                  <View style={styles.leaseContainer}>
                    {getLeaseHistory(selectedProperty.id).map(lease => (
                      <View key={lease.id} style={styles.leaseRow}>
                        <Text style={styles.leaseTenant}>{lease.tenantName}</Text>
                        <Text style={styles.leaseDates}>{lease.startDate} to {lease.endDate}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!selectedProperty.isOccupied && (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: '#007AFF1A', marginBottom: 12 }]}
                    onPress={() => {
                      setSelectedProperty(null);
                      router.replace({
                        pathname: '/(landlord)/payments',
                        params: { openNewLease: 'true', propertyId: selectedProperty.id }
                      });
                    }}
                  >
                    <Text style={[styles.deleteBtnText, { color: '#007AFF' }]}>👤 Assign Tenant / Create Lease</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedProperty.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete Property</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
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
  khuManageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  khuManageText: {
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
  }
});
