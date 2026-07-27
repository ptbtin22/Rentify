//
//  payments.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, Property, Tenant, Lease, Payment, PaymentStatus } from '../../services/Database';

export default function LandlordPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Filtering
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PaymentStatus | 'All'>('All');

  // Modals
  const [isAddLeaseVisible, setIsAddLeaseVisible] = useState(false);

  // Form Fields for New Lease
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-07-31');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

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

  // Update default rent when property is picked
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setMonthlyRent(prop.rentAmount.toString());
        setSecurityDeposit(prop.rentAmount.toString());
      }
    }
  }, [selectedPropertyId]);

  const handleCreateLease = () => {
    if (!selectedPropertyId || !selectedTenantId || !startDate || !endDate) return;

    Database.createLease({
      propertyId: selectedPropertyId,
      tenantId: selectedTenantId,
      startDate,
      endDate,
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit)
    });

    // Reset Form
    setSelectedPropertyId('');
    setSelectedTenantId('');
    setStartDate('2026-08-01');
    setEndDate('2027-07-31');
    setMonthlyRent('');
    setSecurityDeposit('');
    setIsAddLeaseVisible(false);
    Alert.alert('Lease Agreement Saved', 'Lease has been activated. Invoices were generated.');
  };

  const handleRecordPaid = (id: string) => {
    Alert.alert(
      'Confirm Payment',
      'Record this payment as received?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record Paid',
          onPress: () => {
            Database.recordPaymentReceived(id);
          }
        }
      ]
    );
  };

  // Compile layout item view bindings
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
      case 'Paid':
        return { bg: '#34C75926', text: '#34C759' };
      case 'Overdue':
        return { bg: '#FF3B3026', text: '#FF3B30' };
      default:
        return { bg: '#007AFF26', text: '#007AFF' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments & Leases</Text>
        <TouchableOpacity onPress={() => setIsAddLeaseVisible(true)}>
          <Text style={styles.addText}>📝 New Lease</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      <View style={styles.filterRow}>
        {(['All', 'Paid', 'Pending', 'Overdue'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              selectedStatusFilter === f && styles.filterTabActive
            ]}
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
                    <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* New Lease Modal */}
      <Modal visible={isAddLeaseVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddLeaseVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Lease</Text>
              <TouchableOpacity
                onPress={handleCreateLease}
                disabled={!selectedPropertyId || !selectedTenantId}
                style={(!selectedPropertyId || !selectedTenantId) && { opacity: 0.5 }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.label}>Property & Tenant</Text>

              {/* Property Selector */}
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Select Property:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionRow}>
                  {properties.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.selectItem,
                        selectedPropertyId === p.id && styles.selectItemActive
                      ]}
                      onPress={() => setSelectedPropertyId(p.id)}
                    >
                      <Text style={[styles.selectText, selectedPropertyId === p.id && styles.selectTextActive]}>
                        {p.name} ({p.isOccupied ? 'Occupied' : 'Vacant'})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Tenant Selector */}
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>Select Tenant:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionRow}>
                  {tenants.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.selectItem,
                        selectedTenantId === t.id && styles.selectItemActive
                      ]}
                      onPress={() => setSelectedTenantId(t.id)}
                    >
                      <Text style={[styles.selectText, selectedTenantId === t.id && styles.selectTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Lease Terms</Text>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Start Date</Text>
                <TextInput
                  style={styles.textInputRight}
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>End Date</Text>
                <TextInput
                  style={styles.textInputRight}
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Monthly Rent ($)</Text>
                <TextInput
                  style={styles.textInputRight}
                  keyboardType="numeric"
                  value={monthlyRent}
                  onChangeText={setMonthlyRent}
                />
              </View>

              <View style={styles.inputBoxRow}>
                <Text style={styles.rowLabel}>Security Deposit ($)</Text>
                <TextInput
                  style={styles.textInputRight}
                  keyboardType="numeric"
                  value={securityDeposit}
                  onChangeText={setSecurityDeposit}
                />
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
    fontSize: 15,
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
    marginBottom: 12
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
  textInputRight: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '600',
    width: 120,
    textAlign: 'right'
  }
});
