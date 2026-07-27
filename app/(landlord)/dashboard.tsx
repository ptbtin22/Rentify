//
//  dashboard.tsx
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
import { useLanguage } from '../../services/LanguageManager';
import { Database } from '../../services/Database';

export default function LandlordDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const { local } = useLanguage();

  // Metrics state
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    unpaidBalance: 0,
    occupancyRate: 0,
    activeLeasesCount: 0
  });

  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Calculate Metrics from Database
  const calculateMetrics = () => {
    const properties = Database.getProperties();
    const leases = Database.getLeases();
    const payments = Database.getPayments();

    // 1. Total Revenue (sum of all Paid payments)
    const totalRev = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // 2. Unpaid Balance (sum of Pending / Overdue payments)
    const unpaidBal = payments
      .filter(p => p.status !== 'Paid')
      .reduce((sum, p) => sum + p.amount, 0);

    // 3. Occupancy Rate
    const occupiedCount = properties.filter(p => p.isOccupied).length;
    const occRate = properties.length > 0 ? (occupiedCount / properties.length) * 100 : 0;

    // 4. Active Leases
    const activeCount = leases.filter(l => l.status === 'active').length;

    setMetrics({
      totalRevenue: totalRev,
      unpaidBalance: unpaidBal,
      occupancyRate: occRate,
      activeLeasesCount: activeCount
    });

    // 5. Build recent payments with lease details
    const recent = payments
      .map(p => {
        const lease = leases.find(l => l.id === p.leaseId);
        const property = lease ? properties.find(prop => prop.id === lease.propertyId) : null;
        return {
          ...p,
          propertyName: property ? property.name : 'Unknown Property'
        };
      })
      .slice(0, 5); // Limit to top 5
    setRecentPayments(recent);
  };

  useEffect(() => {
    // Subscribe to DB updates
    const unsubscribe = Database.subscribe(calculateMetrics);
    calculateMetrics();
    return unsubscribe;
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return '#34C759'; // Green
    if (status === 'Overdue') return '#FF3B30'; // Red
    return '#FF9500'; // Orange (Pending)
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header View */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>
          <Text style={styles.headerTitle}>Rentify Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={() => { logout(); router.replace('/login'); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Metrics Grid */}
        <View style={styles.grid}>
          {/* Card 1 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💰</Text>
            <Text style={styles.metricValue}>${metrics.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricTitle}>Monthly Revenue</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⚠️</Text>
            <Text style={styles.metricValue}>${metrics.unpaidBalance.toLocaleString()}</Text>
            <Text style={styles.metricTitle}>Unpaid Balance</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🏠</Text>
            <Text style={styles.metricValue}>{metrics.occupancyRate.toFixed(1)}%</Text>
            <Text style={styles.metricTitle}>Occupancy Rate</Text>
          </View>

          {/* Card 4 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📄</Text>
            <Text style={styles.metricValue}>{metrics.activeLeasesCount}</Text>
            <Text style={styles.metricTitle}>Active Leases</Text>
          </View>
        </View>

        {/* Custom Progress Bar Ratio Graph */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Status Overview</Text>
          {recentPayments.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No payment data available yet.</Text>
            </View>
          ) : (
            <View style={styles.ratioContainer}>
              <View style={styles.ratioBar}>
                {/* Visual Ratio breakdown */}
                <View style={[styles.ratioSlice, { flex: Math.max(1, metrics.totalRevenue), backgroundColor: '#34C759' }]} />
                <View style={[styles.ratioSlice, { flex: Math.max(1, metrics.unpaidBalance), backgroundColor: '#FF9500' }]} />
              </View>

              {/* Legends */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.legendText}>Paid</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Recent Payments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {recentPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No recent payments logged.</Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {recentPayments.map((item, index) => (
                <View key={item.id} style={styles.rowItem}>
                  <View style={styles.rowDetails}>
                    <Text style={styles.rowPropName}>{item.propertyName}</Text>
                    <Text style={styles.rowDate}>Due: {item.dueDate}</Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={styles.rowAmount}>${item.amount.toLocaleString()}</Text>
                    <Text style={[styles.rowStatus, { color: getStatusColor(item.status) }]}>
                      {item.status}
                    </Text>
                  </View>
                  {index < recentPayments.length - 1 && <View style={styles.rowDivider} />}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between'
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 12
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  metricTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 4
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 12
  },
  emptyChart: {
    height: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyChartText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600'
  },
  ratioContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 16
  },
  ratioBar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12
  },
  ratioSlice: {
    height: '100%'
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600'
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
