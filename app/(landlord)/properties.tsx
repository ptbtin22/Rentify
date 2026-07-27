//
//  properties.tsx
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
import { Database, Property, PropertyType, Lease } from '../../services/Database';

export default function LandlordProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  // Modals
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [rentAmount, setRentAmount] = useState('1500');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1.0);

  const types: PropertyType[] = ['Apartment', 'House', 'Condo', 'Townhouse'];

  const refreshData = () => {
    setProperties([...Database.getProperties()]);
    setLeases([...Database.getLeases()]);
    setTenants([...Database.getTenants()]);
  };

  useEffect(() => {
    const unsubscribe = Database.subscribe(refreshData);
    refreshData();
    return unsubscribe;
  }, []);

  const handleSave = () => {
    if (!name.trim() || !address.trim() || isNaN(Number(rentAmount))) return;

    Database.addProperty({
      name,
      address,
      propertyType,
      rentAmount: Number(rentAmount),
      bedrooms,
      bathrooms
    });

    // Reset Form
    setName('');
    setAddress('');
    setPropertyType('Apartment');
    setRentAmount('1500');
    setBedrooms(2);
    setBathrooms(1.0);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Properties</Text>
        <TouchableOpacity onPress={() => setIsAddVisible(true)}>
          <Text style={styles.addText}>➕ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No Properties</Text>
            <Text style={styles.emptyDesc}>Add your first rental property to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedProperty(item)}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>
                {item.propertyType === 'House' ? '🏡' : '🏢'}
              </Text>
            </View>

            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>

            <View style={styles.values}>
              <Text style={styles.rent}>${item.rentAmount.toLocaleString()}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: item.isOccupied ? '#34C75926' : '#FF950026' }
                ]}
              >
                <Text style={[styles.statusText, { color: item.isOccupied ? '#34C759' : '#FF9500' }]}>
                  {item.isOccupied ? 'Occupied' : 'Vacant'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Property Modal */}
      <Modal visible={isAddVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Property</Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!name.trim() || !address.trim()}
                style={(!name.trim() || !address.trim()) && { opacity: 0.5 }}
              >
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
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
                <Text style={styles.rowLabel}>Bathrooms: {bathrooms.toFixed(1)}</Text>
                <View style={styles.stepperButtons}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBathrooms(Math.max(1, bathrooms - 0.5))}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setBathrooms(Math.min(10, bathrooms + 0.5))}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Property Detail Modal */}
      <Modal visible={selectedProperty !== null} animationType="slide" transparent>
        {selectedProperty && (
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedProperty(null)}>
                  <Text style={styles.modalCancel}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedProperty.name}</Text>
                <View style={{ width: 50 }} />
              </View>

              <ScrollView style={styles.formScroll}>
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
                    <Text style={styles.detailValue}>{selectedProperty.bathrooms.toFixed(1)}</Text>
                  </View>
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

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedProperty.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete Property</Text>
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
  }
});
