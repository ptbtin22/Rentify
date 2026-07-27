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
  TouchableOpacity
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

  const loadTenantData = () => {
    const leases = Database.getLeases();
    const properties = Database.getProperties();
    const payments = Database.getPayments();

    // In a real app, we filter by the logged-in tenant's ID.
    // For demo/mock purposes, we match the pre-populated 'lease-1' lease.
    const lease = leases.find(l => l.status === 'active') || null;
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

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return '#34C759'; // Green
    if (status === 'Overdue') return '#FF3B30'; // Red
    return '#007AFF'; // Blue (Pending)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>
          <Text style={styles.headerTitle}>Jane Tenant</Text>
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
