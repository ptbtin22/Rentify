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
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { Database, Property, Lease, Payment } from '../../services/Database';

export default function TenantPortal() {
  const router = useRouter();
  const { logout } = useAuth();

  const [activeLease, setActiveLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([]);
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([]);
  
  // Track currently selected lease context
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isContractVisible, setIsContractVisible] = useState(false);

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
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>
          {tenantLeases.length > 1 ? (
            <TouchableOpacity onPress={handleSwitchRoom} style={styles.roomSwitcherBtn}>
              <Text style={styles.headerTitle}>
                Jane Tenant ({property ? property.name : 'Select Room'} ▾)
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.headerTitle}>Jane Tenant</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={() => { logout(); router.replace('/login'); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Lease Agreement Card */}
        <View style={styles.leaseCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Text style={styles.cardHeaderIcon}>📄</Text>
              <Text style={styles.cardHeaderTitle}>Active Lease Agreement</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.leaseDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rental Address</Text>
              <Text style={styles.detailValue}>
                {property ? property.address : '456 Greenway Blvd, Room 202'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={styles.detailValue}>
                ${activeLease ? activeLease.monthlyRent.toLocaleString() : '1,200'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Security Deposit</Text>
              <Text style={styles.detailValue}>
                ${activeLease ? activeLease.securityDeposit.toLocaleString() : '1,200'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lease Duration</Text>
              <Text style={styles.detailValue}>
                {activeLease
                  ? `${activeLease.startDate} - ${activeLease.endDate}`
                  : 'Aug 1, 2026 - Jul 31, 2027'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Tenant Quick Actions & Links ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksRow}>
            {/* View contract */}
            <TouchableOpacity style={styles.linkCard} onPress={() => setIsContractVisible(true)}>
              <Text style={styles.linkIcon}>📄</Text>
              <Text style={styles.linkLabel}>Xem Hợp Đồng</Text>
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
              <Text style={styles.linkIcon}>💬</Text>
              <Text style={styles.linkLabel}>Liên Hệ Chủ Nhà</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payments List Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rent Payments</Text>
          {tenantPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No payment history logged.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {tenantPayments.map((item, index) => (
                <View key={item.id} style={styles.rowItem}>
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowPropName}>{item.notes || 'Rent Invoice'}</Text>
                    <Text style={styles.rowDate}>Due: {item.dueDate}</Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={styles.rowAmount}>${item.amount.toLocaleString()}</Text>
                    <Text style={[styles.rowStatus, { color: getStatusColor(item.status) }]}>
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
  }
});
