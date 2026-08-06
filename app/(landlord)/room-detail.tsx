//
//  room-detail.tsx — room info / payment history / lease history tabs
//

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Database, Lease, Payment, Property, Tenant, getLeaseContractPhotos } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { formatVND } from '../../services/CurrencyUtils';
import { formatDisplayDate } from '../../services/dateUtils';
import { excludeFuturePayments } from '../../services/paymentUtils';
import { ContractImageViewer } from '../../components/ContractImageViewer';
import {
  calcConsumptionKwh,
  formatMeterReading,
  MOCK_METER_PHOTO,
  getMockMeterPhotoUri,
  MOCK_PREVIOUS_METER_KWH,
  MOCK_OCR_CURRENT_KWH,
} from '../../services/meterUtils';

type TabKey = 'info' | 'payments' | 'leases';

export default function RoomDetailScreen() {
  const { local, language } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId?: string; initialTab?: string }>();

  const [property, setProperty] = useState<Property | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tab, setTab] = useState<TabKey>('info');
  const [viewerUris, setViewerUris] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPaid, setSelectedPaid] = useState<Payment | null>(null);

  useEffect(() => {
    const initial = params.initialTab;
    if (initial === 'payments' || initial === 'leases' || initial === 'info') {
      setTab(initial);
    }
  }, [params.initialTab]);

  useEffect(() => {
    const refresh = () => {
      const id = params.propertyId;
      const props = Database.getProperties();
      setProperty(id ? props.find(p => p.id === id) ?? null : null);
      setLeases([...Database.getLeases()]);
      setPayments([...Database.getPayments()]);
      setTenants([...Database.getTenants()]);
    };
    refresh();
    return Database.subscribe(refresh);
  }, [params.propertyId]);

  const activeLease = useMemo(
    () => leases.find(l => l.propertyId === property?.id && l.status === 'active'),
    [leases, property]
  );

  const occupant = useMemo(
    () => (activeLease ? tenants.find(t => t.id === activeLease.tenantId) : undefined),
    [activeLease, tenants]
  );

  const roomPayments = useMemo(() => {
    if (!property) return [];
    const leaseIds = leases.filter(l => l.propertyId === property.id).map(l => l.id);
    return excludeFuturePayments(payments.filter(p => leaseIds.includes(p.leaseId)))
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [property, leases, payments]);

  const roomLeases = useMemo(() => {
    if (!property) return [];
    return leases
      .filter(l => l.propertyId === property.id)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [property, leases]);

  const openMeterPhoto = (payment: Payment) => {
    const uri = payment.meterPhotoUri || getMockMeterPhotoUri();
    if (!uri) return;
    setViewerUris([uri]);
    setViewerIndex(0);
    setViewerVisible(true);
  };

  const paidMeterPrev = selectedPaid?.previousMeterKwh ?? MOCK_PREVIOUS_METER_KWH;
  const paidMeterCurr = selectedPaid?.currentMeterKwh ?? MOCK_OCR_CURRENT_KWH;
  const paidConsumption = calcConsumptionKwh(paidMeterPrev, paidMeterCurr);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: local('room_tab_info') },
    { key: 'payments', label: local('room_tab_payments') },
    { key: 'leases', label: local('room_tab_leases') },
  ];

  const khuName = useMemo(() => {
    if (!property) return '';
    return Database.getKhuTros().find(k => k.id === property.khuTroId)?.name || '';
  }, [property]);

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{local('close')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{local('room_tab_info')}</Text>
          <View style={{ width: 48 }} />
        </View>
        <Text style={styles.empty}>{local('dash_empty')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{local('close')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(17) }]} numberOfLines={1}>
          {property.name}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.tabRow}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive, { fontSize: adjustSize(12) }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {tab === 'info' && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>{local('complex')}</Text>
              <Text style={styles.value}>{khuName || local('dash_empty')}</Text>
              <Text style={styles.label}>{local('address_label')}</Text>
              <Text style={styles.value}>{property.address}</Text>
              <Text style={styles.label}>{local('status_label')}</Text>
              <Text style={[styles.value, { color: property.isOccupied ? '#34C759' : '#FF9500' }]}>
                {property.isOccupied ? local('occupied') : local('vacant')}
              </Text>
            </View>

            <Text style={styles.section}>{local('price_details')}</Text>
            <View style={styles.card}>
              <Row label={local('monthly_rent')} value={formatVND(property.rentAmount)} />
              <Row label={local('electricity_rate_label')} value={`${formatVND(property.electricityRate)}/kWh`} />
              {property.waterRate != null && (
                <Row label={local('water_bill')} value={formatVND(property.waterRate)} />
              )}
              {property.serviceFee != null && (
                <Row label={local('services_bill')} value={formatVND(property.serviceFee)} />
              )}
              {property.parkingFee != null && (
                <Row label={local('parking_fee_optional')} value={formatVND(property.parkingFee)} />
              )}
              {(property.customFees || []).map(f => (
                <Row key={f.id} label={f.name} value={formatVND(f.amount)} />
              ))}
            </View>

            <Text style={styles.section}>{local('occupant_section')}</Text>
            {occupant ? (
              <View style={styles.card}>
                <View style={styles.occupantRow}>
                  {occupant.photoUri ? (
                    <Image source={{ uri: occupant.photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text>👤</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.value, { marginBottom: 4 }]}>{occupant.name}</Text>
                    <Text style={styles.sub}>{occupant.phone}</Text>
                    {occupant.zalo ? <Text style={styles.sub}>Zalo: {occupant.zalo}</Text> : null}
                    {occupant.email ? <Text style={styles.sub}>{occupant.email}</Text> : null}
                  </View>
                </View>
                {(occupant.zalo || occupant.phone) && (
                  <TouchableOpacity
                    style={styles.zaloBtn}
                    onPress={() => {
                      const target = occupant.zalo || occupant.phone;
                      Linking.openURL(`https://zalo.me/${target.replace(/\D/g, '')}`);
                    }}
                  >
                    <Text style={styles.zaloText}>{local('chat_on_zalo')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.sub}>{local('vacant')}</Text>
                <TouchableOpacity
                  style={styles.assignBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(landlord)/create-lease',
                      params: { propertyId: property.id }
                    })
                  }
                >
                  <Text style={styles.assignText}>{local('assign_tenant_action')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {tab === 'payments' && (
          <>
            {roomPayments.length === 0 ? (
              <Text style={styles.empty}>{local('no_payment_history')}</Text>
            ) : (
              roomPayments.map(p => {
                const isPaid = p.status === 'Paid';
                const Row = isPaid ? TouchableOpacity : View;
                return (
                  <Row
                    key={p.id}
                    style={styles.listRow}
                    {...(isPaid
                      ? { onPress: () => setSelectedPaid(p), activeOpacity: 0.75 }
                      : {})}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.value}>{local('due_label')} {formatDisplayDate(p.dueDate)}</Text>
                      <Text style={styles.sub}>{formatVND(p.amount)}</Text>
                      {isPaid ? (
                        <Text style={styles.tapHint}>{local('tap_paid_for_meter')}</Text>
                      ) : null}
                    </View>
                    <Text style={{ color: isPaid ? '#34C759' : '#FF9500', fontWeight: '700' }}>
                      {isPaid ? local('filter_paid') : local('filter_pending')}
                    </Text>
                  </Row>
                );
              })
            )}
          </>
        )}

        {tab === 'leases' && (
          <>
            {roomLeases.length === 0 ? (
              <Text style={styles.empty}>{local('no_active_leases')}</Text>
            ) : (
              roomLeases.map(l => {
                const t = tenants.find(x => x.id === l.tenantId);
                const photos = getLeaseContractPhotos(l);
                return (
                  <View key={l.id} style={styles.leaseCard}>
                    <View style={styles.leaseHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.value}>{t?.name || local('unknown_tenant')}</Text>
                        <Text style={styles.sub}>
                          {formatDisplayDate(l.startDate)} – {formatDisplayDate(l.endDate)}
                        </Text>
                        <Text style={styles.sub}>
                          {formatVND(l.monthlyRent)}/{language === 'vi' ? 'tháng' : 'mo'}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: l.status === 'active' ? '#34C759' : '#8E8E93',
                          fontWeight: '700',
                          fontSize: 12
                        }}
                      >
                        {l.status === 'active' ? local('leasing') : l.status}
                      </Text>
                    </View>

                    <Text style={styles.contractLabel}>{local('signed_contract_label')}</Text>
                    {photos.length === 0 ? (
                      <Text style={styles.sub}>{local('no_contract_photos_lease')}</Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.contractThumbRow}
                      >
                        {photos.map((uri, idx) => (
                          <TouchableOpacity
                            key={`${l.id}-photo-${idx}`}
                            activeOpacity={0.85}
                            onPress={() => {
                              setViewerUris(photos);
                              setViewerIndex(idx);
                              setViewerVisible(true);
                            }}
                          >
                            <Image
                              source={{ uri }}
                              style={styles.contractThumb}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedPaid}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPaid(null)}
      >
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedPaid(null)} hitSlop={12}>
              <Text style={styles.back}>{local('close')}</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: adjustSize(17) }]} numberOfLines={1}>
              {local('payment_meter_verify_title')}
            </Text>
            <View style={{ width: 48 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Text style={styles.verifyHint}>{local('payment_meter_verify_hint')}</Text>
            {selectedPaid ? (
              <View style={styles.card}>
                <Text style={styles.label}>{local('due_label')}</Text>
                <Text style={styles.value}>{formatDisplayDate(selectedPaid.dueDate)}</Text>
                <Text style={styles.label}>{local('payment_amount')}</Text>
                <Text style={styles.value}>{formatVND(selectedPaid.amount)}</Text>
                {selectedPaid.notes ? (
                  <>
                    <Text style={styles.label}>{local('notes')}</Text>
                    <Text style={styles.value}>{selectedPaid.notes}</Text>
                  </>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.section}>{local('meter_reading_section')}</Text>
            <View style={styles.card}>
              <View style={styles.priceRow}>
                <Text style={styles.sub}>{local('meter_prev_reading')}</Text>
                <Text style={styles.value}>{formatMeterReading(paidMeterPrev)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.sub}>{local('meter_curr_reading')}</Text>
                <Text style={styles.value}>{formatMeterReading(paidMeterCurr)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.sub}>{local('meter_consumption')}</Text>
                <Text style={[styles.value, { color: '#007AFF' }]}>{paidConsumption} kWh</Text>
              </View>
            </View>

            <Text style={styles.section}>{local('meter_photo_label')}</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => selectedPaid && openMeterPhoto(selectedPaid)}>
              <Image
                source={
                  selectedPaid?.meterPhotoUri
                    ? { uri: selectedPaid.meterPhotoUri }
                    : MOCK_METER_PHOTO
                }
                style={styles.meterPhoto}
                resizeMode="contain"
              />
              <Text style={styles.tapHint}>{local('pinch_to_zoom_hint')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ContractImageViewer
        visible={viewerVisible}
        uris={viewerUris}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.sub}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
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
  headerTitle: { fontWeight: '800', color: '#1C1C1E', maxWidth: '60%' },
  back: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 8
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { color: '#8E8E93', fontWeight: '700' },
  tabTextActive: { color: '#007AFF' },
  section: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase'
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  label: { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginTop: 8, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  sub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  occupantRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  zaloBtn: {
    marginTop: 12,
    backgroundColor: '#0068FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  zaloText: { color: '#FFF', fontWeight: '800' },
  assignBtn: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  assignText: { color: '#FFF', fontWeight: '800' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8
  },
  tapHint: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4
  },
  verifyHint: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 14
  },
  meterPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginBottom: 6
  },
  leaseCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10
  },
  leaseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  contractLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  contractThumbRow: {
    gap: 8,
    paddingRight: 4
  },
  contractThumb: {
    width: 96,
    height: 128,
    borderRadius: 8,
    backgroundColor: '#E5E5EA'
  },
  empty: { color: '#8E8E93', textAlign: 'center', marginTop: 40 }
});
