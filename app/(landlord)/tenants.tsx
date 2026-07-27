//
//  tenants.tsx
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
import { Database, Tenant, Lease } from '../../services/Database';

export default function LandlordTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<any[]>([]);

  // Modals
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const refreshData = () => {
    setTenants([...Database.getTenants()]);
    setLeases([...Database.getLeases()]);
    setProperties([...Database.getProperties()]);
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(refreshData);
    refreshData();
    return unsubscribe;
  }, []);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;

    Database.addTenant({
      name,
      email,
      phone,
      notes
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setIsAddVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Tenant',
      'Are you sure you want to delete this tenant? This will also remove any linked leases and payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Database.deleteTenant(id);
            setSelectedTenant(null);
          }
        }
      ]
    );
  };

  // Get leases history for a tenant
  const getTenantLeases = (tenantId: string) => {
    return leases
      .filter(l => l.tenantId === tenantId)
      .map(l => {
        const prop = properties.find(p => p.id === l.propertyId);
        return {
          ...l,
          propertyName: prop ? prop.name : 'Unknown Property'
        };
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tenants</Text>
        <TouchableOpacity onPress={() => setIsAddVisible(true)}>
          <Text style={styles.addText}>➕ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tenants List */}
      <FlatList
        data={tenants}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>No Tenants</Text>
            <Text style={styles.emptyDesc}>Add your first tenant to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const activeLeases = leases.filter(l => l.tenantId === item.id && l.status === 'active');
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedTenant(item)}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>👤</Text>
              </View>

              <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>

              <View style={styles.values}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: activeLeases.length > 0 ? '#34C75926' : '#8E8E9326' }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: activeLeases.length > 0 ? '#34C759' : '#8E8E93' }
                    ]}
                  >
                    {activeLeases.length > 0 ? 'Leasing' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Add Tenant Modal */}
      <Modal visible={isAddVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Tenant</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!name.trim() || !email.trim()}
                style={(!name.trim() || !email.trim()) && { opacity: 0.5 }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.label}>Contact Information</Text>
              
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name"
                  placeholderTextColor="#8E8E93"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email"
                  placeholderTextColor="#8E8E93"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone"
                  placeholderTextColor="#8E8E93"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <Text style={styles.label}>Notes</Text>
              <View style={styles.notesBox}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add any notes..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Tenant Detail Modal */}
      <Modal visible={selectedTenant !== null} animationType="slide" transparent>
        {selectedTenant && (
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedTenant(null)}>
                  <Text style={styles.modalCancel}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedTenant.name}</Text>
                <View style={{ width: 50 }} />
              </View>

              <ScrollView style={styles.formScroll}>
                <Text style={styles.label}>Contact Details</Text>
                <View style={styles.detailContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{selectedTenant.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedTenant.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{selectedTenant.phone || 'N/A'}</Text>
                  </View>
                  {selectedTenant.notes ? (
                    <View style={styles.notesDetails}>
                      <Text style={styles.notesTitle}>Notes</Text>
                      <Text style={styles.notesBody}>{selectedTenant.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Leases List */}
                <Text style={styles.label}>Leases</Text>
                {getTenantLeases(selectedTenant.id).length === 0 ? (
                  <View style={styles.emptyLease}>
                    <Text style={styles.emptyLeaseText}>No active leases logged.</Text>
                  </View>
                ) : (
                  <View style={styles.leaseContainer}>
                    {getTenantLeases(selectedTenant.id).map(lease => (
                      <View key={lease.id} style={styles.leaseRow}>
                        <Text style={styles.leasePropName}>{lease.propertyName}</Text>
                        <Text style={styles.leaseDates}>{lease.startDate} to {lease.endDate}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedTenant.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete Tenant</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        )}
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
    backgroundColor: '#5856D61A',
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
  email: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2
  },
  values: {
    alignItems: 'flex-end'
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
  inputBox: {
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 12
  },
  textInput: {
    fontSize: 15,
    color: '#1C1C1E'
  },
  notesBox: {
    minHeight: 100,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E'
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
  notesDetails: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 10
  },
  notesTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  notesBody: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20
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
  leasePropName: {
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
  }
});
