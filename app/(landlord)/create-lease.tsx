//
//  create-lease.tsx — full-screen lease creation (complex → room → tenant)
//

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActionSheetIOS
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Database, CustomFee, KhuTro, Property, Tenant } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { formatAmountInput, parseAmountInput } from '../../services/CurrencyUtils';
import { formatDisplayDate } from '../../services/dateUtils';
import { ContractImageViewer } from '../../components/ContractImageViewer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CreateLeaseScreen() {
  const { local, localF } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const router = useRouter();
  const params = useLocalSearchParams<{ tenantId?: string; propertyId?: string }>();

  const [khuTros, setKhuTros] = useState<KhuTro[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const [selectedKhuId, setSelectedKhuId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [khuQuery, setKhuQuery] = useState('');
  const [roomQuery, setRoomQuery] = useState('');
  const [tenantQuery, setTenantQuery] = useState('');

  const [startDate, setStartDate] = useState(new Date('2026-08-01'));
  const [endDate, setEndDate] = useState(new Date('2027-07-31'));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [tenantPhoto, setTenantPhoto] = useState<string | undefined>();
  const [contractPhotos, setContractPhotos] = useState<string[]>([]);
  const [viewerUris, setViewerUris] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Room price components — editable here, saved back onto the room
  const [electricityRate, setElectricityRate] = useState('');
  const [waterRate, setWaterRate] = useState('');
  const [serviceFee, setServiceFee] = useState('');
  const [parkingFee, setParkingFee] = useState('');
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeAmount, setNewFeeAmount] = useState('');

  useEffect(() => {
    const refresh = () => {
      setKhuTros([...Database.getKhuTros()]);
      setProperties([...Database.getProperties()]);
      setTenants([...Database.getTenants()]);
    };
    const unsub = Database.subscribe(refresh);
    refresh();
    return unsub;
  }, []);

  // Prefill from route params — only vacant rooms can be selected for a new lease
  useEffect(() => {
    if (params.tenantId) setSelectedTenantId(params.tenantId);
    if (params.propertyId) {
      const prop = Database.getProperties().find(p => p.id === params.propertyId);
      if (prop) {
        setSelectedKhuId(prop.khuTroId);
        if (!prop.isOccupied) setSelectedPropertyId(params.propertyId);
      }
    }
  }, [params.tenantId, params.propertyId]);

  // Default tenant attachment photo = that tenant's avatar from when they were added
  useEffect(() => {
    if (!selectedTenantId) {
      setTenantPhoto(undefined);
      return;
    }
    const tenant = Database.getTenants().find(t => t.id === selectedTenantId);
    setTenantPhoto(tenant?.photoUri);
  }, [selectedTenantId]);

  // Load the selected room's prices into the editable form
  useEffect(() => {
    if (!selectedPropertyId) return;
    const prop = Database.getProperties().find(p => p.id === selectedPropertyId);
    if (!prop || prop.isOccupied) {
      setSelectedPropertyId('');
      return;
    }
    setMonthlyRent(formatAmountInput(prop.rentAmount));
    setSecurityDeposit(formatAmountInput(prop.rentAmount));
    setElectricityRate(formatAmountInput(prop.electricityRate ?? ''));
    setWaterRate(prop.waterRate ? formatAmountInput(prop.waterRate) : '');
    setServiceFee(prop.serviceFee ? formatAmountInput(prop.serviceFee) : '');
    setParkingFee(prop.parkingFee !== undefined ? formatAmountInput(prop.parkingFee) : '');
    setCustomFees(prop.customFees ? [...prop.customFees] : []);
    setNewFeeName('');
    setNewFeeAmount('');
  }, [selectedPropertyId]);

  const filteredKhu = useMemo(() => {
    const q = khuQuery.trim().toLowerCase();
    if (!q) return khuTros;
    return khuTros.filter(k => k.name.toLowerCase().includes(q) || k.address.toLowerCase().includes(q));
  }, [khuTros, khuQuery]);

  const vacantRoomsInKhu = useMemo(() => {
    if (!selectedKhuId) return [];
    return properties.filter(p => p.khuTroId === selectedKhuId && !p.isOccupied);
  }, [properties, selectedKhuId]);

  const roomsInKhu = useMemo(() => {
    const q = roomQuery.trim().toLowerCase();
    return vacantRoomsInKhu.filter(
      p => !q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [vacantRoomsInKhu, roomQuery]);

  const filteredTenants = useMemo(() => {
    const q = tenantQuery.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.email || '').toLowerCase().includes(q)
    );
  }, [tenants, tenantQuery]);

  const onStartChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (selected) setStartDate(selected);
  };

  const onEndChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selected) setEndDate(selected);
  };

  const pickAttachment = (kind: 'tenant' | 'contract') => {
    const apply = (uris: string[]) => {
      if (uris.length === 0) return;
      if (kind === 'tenant') setTenantPhoto(uris[0]);
      else setContractPhotos(prev => [...prev, ...uris]);
    };
    const fromLibrary = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(local('permission_required'), local('permission_library'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: kind === 'contract'
      });
      if (!result.canceled && result.assets?.length) apply(result.assets.map(a => a.uri));
    };
    const fromDocs = async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: kind === 'contract'
      });
      if (!result.canceled && result.assets?.length) apply(result.assets.map(a => a.uri));
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [local('cancel'), local('photo_library_action'), local('browse_files_action')], cancelButtonIndex: 0 },
        (i) => {
          if (i === 1) fromLibrary();
          if (i === 2) fromDocs();
        }
      );
    } else {
      Alert.alert(local('upload_action'), undefined, [
        { text: local('photo_library_action'), onPress: fromLibrary },
        { text: local('browse_files_action'), onPress: fromDocs },
        { text: local('cancel'), style: 'cancel' }
      ]);
    }
  };

  const handleAddCustomFee = () => {
    const amount = parseAmountInput(newFeeAmount);
    if (!newFeeName.trim() || amount <= 0) {
      Alert.alert(local('invalid_fee_title'), local('invalid_fee_desc'));
      return;
    }
    setCustomFees(prev => [
      ...prev,
      { id: 'fee-' + Math.random().toString(36).substring(7), name: newFeeName.trim(), amount }
    ]);
    setNewFeeName('');
    setNewFeeAmount('');
  };

  const handleSave = () => {
    if (!selectedPropertyId || !selectedTenantId) return;

    const rent = parseAmountInput(monthlyRent);
    const electricity = parseAmountInput(electricityRate);
    if (rent <= 0 || electricity <= 0) {
      Alert.alert(local('invalid_price_title'), local('invalid_price_desc'));
      return;
    }

    // Price edits belong to the room itself, not just this lease
    Database.updateProperty(selectedPropertyId, {
      rentAmount: rent,
      electricityRate: electricity,
      waterRate: waterRate === '' ? 0 : parseAmountInput(waterRate),
      serviceFee: serviceFee === '' ? 0 : parseAmountInput(serviceFee),
      parkingFee: parkingFee === '' ? undefined : parseAmountInput(parkingFee),
      customFees
    });

    Database.createLease({
      propertyId: selectedPropertyId,
      tenantId: selectedTenantId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      monthlyRent: rent,
      securityDeposit: parseAmountInput(securityDeposit),
      tenantPhoto,
      contractPhotos
    });
    Alert.alert(local('lease_saved_title'), local('lease_saved_desc'));
    router.back();
  };

  const canSave = !!selectedPropertyId && !!selectedTenantId;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.headerBtn}>{local('cancel')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(17) }]}>{local('create_lease_title')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} style={!canSave && { opacity: 0.4 }}>
          <Text style={styles.headerBtnSave}>{local('save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Complex */}
        <View style={styles.sectionBlock}>
          <Text style={styles.section}>{local('select_complex_section')}</Text>
          <TextInput
            style={styles.search}
            placeholder={local('search_complex')}
            placeholderTextColor="#8E8E93"
            value={khuQuery}
            onChangeText={setKhuQuery}
          />
          {filteredKhu.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[styles.row, selectedKhuId === k.id && styles.rowActive]}
              onPress={() => {
                setSelectedKhuId(k.id);
                setSelectedPropertyId('');
                setRoomQuery('');
              }}
            >
              <Text style={[styles.rowTitle, selectedKhuId === k.id && styles.rowTitleActive]}>{k.name}</Text>
              <Text style={styles.rowSub}>{k.address}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionDivider} />

        {/* Rooms — vacant only */}
        <View style={styles.sectionBlock}>
          <Text style={styles.section}>{local('select_room_section')}</Text>
          {!selectedKhuId ? (
            <Text style={styles.hint}>{local('select_complex_first')}</Text>
          ) : vacantRoomsInKhu.length === 0 ? (
            <View style={styles.emptyVacantBox}>
              <Text style={styles.emptyVacantIcon}>🏠</Text>
              <Text style={styles.emptyVacantTitle}>{local('no_vacant_rooms')}</Text>
              <Text style={styles.emptyVacantHint}>{local('no_vacant_rooms_hint')}</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.search}
                placeholder={local('search_room')}
                placeholderTextColor="#8E8E93"
                value={roomQuery}
                onChangeText={setRoomQuery}
              />
              {roomsInKhu.length === 0 ? (
                <Text style={styles.hint}>{local('no_vacant_rooms')}</Text>
              ) : (
                roomsInKhu.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.row, selectedPropertyId === p.id && styles.rowActive]}
                    onPress={() => setSelectedPropertyId(p.id)}
                  >
                    <Text style={[styles.rowTitle, selectedPropertyId === p.id && styles.rowTitleActive]}>
                      {p.name} ({local('vacant')})
                    </Text>
                    <Text style={styles.rowSub}>{p.address}</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* Tenants */}
        <View style={styles.sectionBlock}>
          <Text style={styles.section}>{local('select_tenant_section')}</Text>
          <TextInput
            style={styles.search}
            placeholder={local('search_tenant')}
            placeholderTextColor="#8E8E93"
            value={tenantQuery}
            onChangeText={setTenantQuery}
          />
          {filteredTenants.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.row, selectedTenantId === t.id && styles.rowActive]}
              onPress={() => setSelectedTenantId(t.id)}
            >
              <Text style={[styles.rowTitle, selectedTenantId === t.id && styles.rowTitleActive]}>{t.name}</Text>
              <Text style={styles.rowSub}>{t.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionDivider} />

        {/* Terms */}
        <View style={styles.sectionBlock}>
        <Text style={styles.section}>{local('lease_terms_section')}</Text>

        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => {
            setShowEndPicker(false);
            setShowStartPicker(v => !v);
          }}
        >
          <Text style={styles.dateLabel}>{local('start_date_label')}</Text>
          <Text style={styles.dateValue}>{formatDisplayDate(startDate)}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={onStartChange}
            onDismiss={() => setShowStartPicker(false)}
          />
        )}

        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => {
            setShowStartPicker(false);
            setShowEndPicker(v => !v);
          }}
        >
          <Text style={styles.dateLabel}>{local('end_date_label')}</Text>
          <Text style={styles.dateValue}>{formatDisplayDate(endDate)}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={startDate}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={onEndChange}
            onDismiss={() => setShowEndPicker(false)}
          />
        )}

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{local('monthly_rent_room_label')}</Text>
          <TextInput
            style={styles.inputRight}
            keyboardType="numeric"
            value={monthlyRent}
            onChangeText={(v) => setMonthlyRent(formatAmountInput(v))}
          />
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{local('security_deposit_vnd_label')}</Text>
          <TextInput
            style={styles.inputRight}
            keyboardType="numeric"
            value={securityDeposit}
            onChangeText={(v) => setSecurityDeposit(formatAmountInput(v))}
          />
        </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Room price components — edits are saved back onto the room */}
        <View style={styles.sectionBlock}>
        <Text style={styles.section}>{local('price_details')}</Text>
        {!selectedPropertyId ? (
          <Text style={styles.hint}>{local('select_property_label')}</Text>
        ) : (
          <>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{local('electricity_rate_label')}</Text>
              <TextInput
                style={styles.inputRight}
                keyboardType="numeric"
                value={electricityRate}
                onChangeText={(v) => setElectricityRate(formatAmountInput(v))}
              />
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{local('water_rate_optional')}</Text>
              <TextInput
                style={styles.inputRight}
                keyboardType="numeric"
                value={waterRate}
                onChangeText={(v) => setWaterRate(formatAmountInput(v))}
              />
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{local('service_fee_optional')}</Text>
              <TextInput
                style={styles.inputRight}
                keyboardType="numeric"
                value={serviceFee}
                onChangeText={(v) => setServiceFee(formatAmountInput(v))}
              />
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>{local('parking_fee_optional')}</Text>
              <TextInput
                style={styles.inputRight}
                keyboardType="numeric"
                value={parkingFee}
                onChangeText={(v) => setParkingFee(formatAmountInput(v))}
              />
            </View>

            {customFees.map(fee => (
              <View key={fee.id} style={styles.dateRow}>
                <TextInput
                  style={[styles.dateLabel, { flex: 1 }]}
                  value={fee.name}
                  onChangeText={(v) =>
                    setCustomFees(prev => prev.map(f => (f.id === fee.id ? { ...f, name: v } : f)))
                  }
                />
                <TextInput
                  style={styles.inputRight}
                  keyboardType="numeric"
                  value={formatAmountInput(fee.amount)}
                  onChangeText={(v) =>
                    setCustomFees(prev =>
                      prev.map(f => (f.id === fee.id ? { ...f, amount: parseAmountInput(v) } : f))
                    )
                  }
                />
                <TouchableOpacity
                  onPress={() => setCustomFees(prev => prev.filter(f => f.id !== fee.id))}
                  hitSlop={8}
                  style={{ marginLeft: 10 }}
                >
                  <Text style={styles.removeFeeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.newFeeRow}>
              <TextInput
                style={styles.newFeeName}
                placeholder={local('custom_fee_name')}
                placeholderTextColor="#8E8E93"
                value={newFeeName}
                onChangeText={setNewFeeName}
              />
              <TextInput
                style={styles.newFeeAmount}
                placeholder={local('custom_fee_amount')}
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                value={newFeeAmount}
                onChangeText={(v) => setNewFeeAmount(formatAmountInput(v))}
              />
              <TouchableOpacity style={styles.addFeeBtn} onPress={handleAddCustomFee}>
                <Text style={styles.addFeeBtnText}>{local('add_custom_fee')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.sectionBlock}>
        <Text style={styles.section}>{local('attachments_photos_section')}</Text>
        <TouchableOpacity style={styles.attachBtn} onPress={() => pickAttachment('tenant')}>
          <Text style={styles.attachText}>
            {local('tenant_photo')}: {tenantPhoto ? local('uploaded_status') : local('missing_status')}
          </Text>
        </TouchableOpacity>
        {tenantPhoto && (
          <View style={styles.thumbRow}>
            <View style={styles.thumbWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setViewerUris([tenantPhoto]);
                  setViewerIndex(0);
                  setViewerVisible(true);
                }}
              >
                <Image source={{ uri: tenantPhoto }} style={styles.thumb} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.thumbRemoveBtn}
                onPress={() => setTenantPhoto(undefined)}
                hitSlop={6}
              >
                <Text style={styles.thumbRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.attachBtn} onPress={() => pickAttachment('contract')}>
          <Text style={styles.attachText}>
            {local('signed_contract_label')}:{' '}
            {contractPhotos.length > 0
              ? localF('contract_photos_count', { count: contractPhotos.length })
              : local('missing_status')}
          </Text>
        </TouchableOpacity>
        {contractPhotos.length > 0 && (
          <View style={styles.thumbRow}>
            {contractPhotos.map((uri, idx) => (
              <View key={`${uri}-${idx}`} style={styles.thumbWrapper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setViewerUris(contractPhotos);
                    setViewerIndex(idx);
                    setViewerVisible(true);
                  }}
                >
                  <Image source={{ uri }} style={styles.thumb} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.thumbRemoveBtn}
                  onPress={() => setContractPhotos(prev => prev.filter((_, i) => i !== idx))}
                  hitSlop={6}
                >
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        </View>
      </ScrollView>

      <ContractImageViewer
        visible={viewerVisible}
        uris={viewerUris}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA'
  },
  headerTitle: { fontWeight: '800', color: '#1C1C1E' },
  headerBtn: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  headerBtnSave: { color: '#007AFF', fontWeight: '800', fontSize: 16 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionBlock: {
    paddingTop: 4,
    paddingBottom: 4
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C7C7CC',
    marginTop: 12,
    marginBottom: 4
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase'
  },
  emptyVacantBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8
  },
  emptyVacantIcon: { fontSize: 36, marginBottom: 8 },
  emptyVacantTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 6
  },
  emptyVacantHint: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18
  },
  search: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
    color: '#1C1C1E'
  },
  hint: { color: '#8E8E93', fontSize: 13, marginBottom: 8 },
  row: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8
  },
  rowActive: { backgroundColor: '#007AFF1A', borderWidth: 1, borderColor: '#007AFF' },
  rowTitle: { fontWeight: '700', color: '#1C1C1E', fontSize: 15 },
  rowTitleActive: { color: '#007AFF' },
  rowSub: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8
  },
  dateLabel: { fontWeight: '600', color: '#1C1C1E', fontSize: 14 },
  dateValue: { color: '#007AFF', fontWeight: '700' },
  inputRight: { minWidth: 100, textAlign: 'right', fontWeight: '700', color: '#1C1C1E', fontSize: 15 },
  attachBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8
  },
  attachText: { fontWeight: '600', color: '#1C1C1E' },
  removeFeeText: { color: '#FF3B30', fontWeight: '900', fontSize: 15 },
  newFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  newFeeName: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#1C1C1E'
  },
  newFeeAmount: {
    width: 110,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'right',
    color: '#1C1C1E'
  },
  addFeeBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  addFeeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  thumbWrapper: { position: 'relative' },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 10,
    backgroundColor: '#F2F2F7'
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center'
  },
  thumbRemoveText: { color: '#FFF', fontWeight: '900', fontSize: 11 }
});
