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
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { Database } from '../../services/Database';
import { useElderlyMode } from '../../services/AccessibilityManager';
import { ProfileModal } from '../../components/ProfileModal';
import { SettingsModal } from '../../components/SettingsModal';
import { NotificationManager } from '../../services/NotificationManager';
import { PostDetailModal } from '../../components/PostDetailModal';
import { Notice } from '../../services/NoticeRepository';

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
  const [isReportVisible, setIsReportVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [selectedDetailPost, setSelectedDetailPost] = useState<Notice | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const { adjustSize } = useElderlyMode();

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
    const unsubscribe = Database.subscribe(calculateMetrics);
    calculateMetrics();
    return unsubscribe;
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Paid') return '#34C759'; // Green
    if (status === 'Overdue') return '#FF3B30'; // Red
    return '#FF9500'; // Orange (Pending)
  };

  // Quick Action: Remind Rent (Manual alert configuration triggers push notifications)
  const handleRemindRent = async () => {
    const properties = Database.getProperties();
    const payments = Database.getPayments();
    const leases = Database.getLeases();

    const unpaidCount = payments.filter(p => p.status !== 'Paid').length;
    if (unpaidCount === 0) {
      Alert.alert(
        local('announcements') || 'Reminders',
        'All invoices are fully paid. No reminders needed!'
      );
      return;
    }

    // Trigger local push notification to simulate the reminders going out
    await NotificationManager.triggerLocalNotification(
      '⚡ Rent Reminder Dispatched',
      `Sent rent reminders to ${unpaidCount} rooms with outstanding balances.`
    );

    Alert.alert(
      'Reminders Dispatched',
      `Rent invoice reminders successfully sent to ${unpaidCount} unpaid rooms via Push & Zalo.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header View */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { fontSize: adjustSize(12) }]}>Welcome Back 👋</Text>
          <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>Rentify Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileHeaderBtn} 
          onPress={() => setIsDropdownVisible(!isDropdownVisible)}
        >
          <Text style={[styles.profileHeaderInitials, { fontSize: adjustSize(14) }]}>NL</Text>
        </TouchableOpacity>
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
        {/* Metrics Grid */}
        <View style={styles.grid}>
          {/* Card 1 */}
          <View style={styles.metricCard}>
            <Text style={[styles.metricIcon, { fontSize: adjustSize(24) }]}>💰</Text>
            <Text style={[styles.metricValue, { fontSize: adjustSize(20) }]}>${metrics.totalRevenue.toLocaleString()}</Text>
            <Text style={[styles.metricTitle, { fontSize: adjustSize(12) }]}>Monthly Revenue</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.metricCard}>
            <Text style={[styles.metricIcon, { fontSize: adjustSize(24) }]}>⚠️</Text>
            <Text style={[styles.metricValue, { fontSize: adjustSize(20) }]}>${metrics.unpaidBalance.toLocaleString()}</Text>
            <Text style={[styles.metricTitle, { fontSize: adjustSize(12) }]}>Unpaid Balance</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.metricCard}>
            <Text style={[styles.metricIcon, { fontSize: adjustSize(24) }]}>🏠</Text>
            <Text style={[styles.metricValue, { fontSize: adjustSize(20) }]}>{metrics.occupancyRate.toFixed(1)}%</Text>
            <Text style={[styles.metricTitle, { fontSize: adjustSize(12) }]}>Occupancy Rate</Text>
          </View>

          {/* Card 4 */}
          <View style={styles.metricCard}>
            <Text style={[styles.metricIcon, { fontSize: adjustSize(24) }]}>📄</Text>
            <Text style={[styles.metricValue, { fontSize: adjustSize(20) }]}>{metrics.activeLeasesCount}</Text>
            <Text style={[styles.metricTitle, { fontSize: adjustSize(12) }]}>Active Leases</Text>
          </View>
        </View>

        {/* ─── Landlord Quick Actions Row ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {/* Create Lease action */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push({ pathname: '/(landlord)/payments', params: { openNewLease: 'true' } })}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#007AFF15' }]}>
                <Text style={styles.actionIcon}>📝</Text>
              </View>
              <Text style={styles.actionLabel}>{local('create_lease')}</Text>
            </TouchableOpacity>

            {/* Remind Rent action */}
            <TouchableOpacity style={styles.actionItem} onPress={handleRemindRent}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#FF950015' }]}>
                <Text style={styles.actionIcon}>🔔</Text>
              </View>
              <Text style={styles.actionLabel}>{local('send_reminder')}</Text>
            </TouchableOpacity>

            {/* Show Reports modal */}
            <TouchableOpacity style={styles.actionItem} onPress={() => setIsReportVisible(true)}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#34C75915' }]}>
                <Text style={styles.actionIcon}>📈</Text>
              </View>
              <Text style={styles.actionLabel}>{local('view_reports')}</Text>
            </TouchableOpacity>
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
          <Text style={[styles.sectionTitle, { fontSize: adjustSize(17) }]}>Recent Payments</Text>
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

      {/* ─── Premium Revenue Report Modal ─── */}
      <Modal visible={isReportVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsReportVisible(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Revenue & Reports</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSectionLabel}>Overview Analysis</Text>
              
              <View style={styles.reportSummaryCard}>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Collected Income (Paid):</Text>
                  <Text style={[styles.reportValue, { color: '#34C759' }]}>
                    ${metrics.totalRevenue.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Outstanding Invoices (Pending):</Text>
                  <Text style={[styles.reportValue, { color: '#FF9500' }]}>
                    ${metrics.unpaidBalance.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>Total Projected Income:</Text>
                  <Text style={[styles.reportValue, { fontWeight: '800' }]}>
                    ${(metrics.totalRevenue + metrics.unpaidBalance).toLocaleString()}
                  </Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>Monthly Projections</Text>
              <View style={styles.chartMockContainer}>
                <Text style={styles.chartTitle}>Average Rent Breakdown</Text>
                <View style={styles.barItem}>
                  <Text style={styles.barLabel}>Aug 2026</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '85%', backgroundColor: '#007AFF' }]} />
                  </View>
                  <Text style={styles.barPercent}>85%</Text>
                </View>
                <View style={styles.barItem}>
                  <Text style={styles.barLabel}>Sep 2026</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '92%', backgroundColor: '#007AFF' }]} />
                  </View>
                  <Text style={styles.barPercent}>92%</Text>
                </View>
                <View style={styles.barItem}>
                  <Text style={styles.barLabel}>Oct 2026</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: '60%', backgroundColor: '#FF3B30' }]} />
                  </View>
                  <Text style={styles.barPercent}>60%</Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>Performance Insights</Text>
              <View style={styles.insightBox}>
                <Text style={styles.insightText}>
                  💡 Your occupancy rate is currently sitting at <Text style={styles.boldText}>{metrics.occupancyRate.toFixed(0)}%</Text>. 
                  Filling vacant rooms could boost monthly revenue by up to <Text style={styles.boldText}>$2,500</Text>.
                </Text>
              </View>
            </ScrollView>
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
        commenterName="Landlord"
        onClose={() => setSelectedDetailPost(null)}
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
  // ─── Actions Row Styles ───
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    marginBottom: 12
  },
  actionItem: {
    alignItems: 'center',
    width: 80
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  actionIcon: {
    fontSize: 22
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E'
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
  },
  // ─── Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    height: '85%',
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
    padding: 16
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 16
  },
  reportSummaryCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reportLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500'
  },
  reportValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  chartMockContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 14
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  barLabel: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93'
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 5
  },
  barPercent: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'right'
  },
  insightBox: {
    backgroundColor: '#007AFF0D',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#007AFF1A'
  },
  insightText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18
  },
  boldText: {
    fontWeight: '800'
  },
  profileHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF1F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#007AFF'
  },
  profileHeaderInitials: {
    fontWeight: '900',
    color: '#007AFF'
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
  }
});
