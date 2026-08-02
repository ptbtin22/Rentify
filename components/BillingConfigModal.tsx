//
//  BillingConfigModal.tsx
//  Rentify
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database } from '../services/Database';
import { useLanguage } from '../services/LanguageManager';
import { useElderlyMode } from '../services/AccessibilityManager';

interface BillingConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BillingConfigModal({ visible, onClose }: BillingConfigModalProps) {
  const { local } = useLanguage();
  const { adjustSize } = useElderlyMode();
  const insets = useSafeAreaInsets();
  const themeColor = '#007AFF'; // Blue theme color for landlord

  // Local state synced from Database
  const [remindDay, setRemindDay] = useState('1');
  const [lateDays, setLateDays] = useState('3');
  const [leaseWarningDays, setLeaseWarningDays] = useState('14');
  const [billingChannels, setBillingChannels] = useState<string[]>([]);
  const [leaseChannels, setLeaseChannels] = useState<string[]>([]);

  // Load config on visibility change
  useEffect(() => {
    if (visible) {
      const config = Database.getAppConfig();
      setRemindDay(config.remindDay.toString());
      setLateDays(config.lateDays.toString());
      setLeaseWarningDays(config.leaseWarningDays.toString());
      setBillingChannels(config.billingChannels);
      setLeaseChannels(config.leaseChannels);
    }
  }, [visible]);

  const toggleBillingChannel = (ch: string) => {
    setBillingChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const toggleLeaseChannel = (ch: string) => {
    setLeaseChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = () => {
    Database.updateAppConfig({
      remindDay: Number(remindDay) || 1,
      lateDays: Number(lateDays) || 3,
      leaseWarningDays: Number(leaseWarningDays) || 14,
      billingChannels,
      leaseChannels
    });
    Alert.alert(local('notification_config_success'), local('notification_config_success_desc'));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 12 : Math.max(insets.top, 12) }]}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>{local('cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { fontSize: adjustSize(17) }]}>{local('billing_config') || 'Cấu Hình Thông Báo'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.modalSend, { color: themeColor }]}>{local('save')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Part 1: billing settings */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(12) }]}>{local('billing_reminders_config')}</Text>
          
          <View style={styles.configItemRow}>
            <Text style={[styles.configItemLabel, { fontSize: adjustSize(14) }]}>{local('billing_day_label')}</Text>
            <TextInput
              style={styles.configNumberInput}
              keyboardType="numeric"
              value={remindDay}
              onChangeText={setRemindDay}
              maxLength={2}
            />
          </View>
          
          <View style={styles.configItemRow}>
            <Text style={[styles.configItemLabel, { fontSize: adjustSize(14) }]}>{local('late_billing_days')}</Text>
            <TextInput
              style={styles.configNumberInput}
              keyboardType="numeric"
              value={lateDays}
              onChangeText={setLateDays}
              maxLength={2}
            />
          </View>

          <Text style={[styles.configSubLabel, { fontSize: adjustSize(12) }]}>{local('notification_channels')}</Text>
          <View style={styles.channelsRow}>
            {['Zalo', 'SMS', 'Email'].map(ch => {
              const active = billingChannels.includes(ch);
              return (
                <TouchableOpacity
                  key={ch}
                  style={[styles.channelToggle, active && { backgroundColor: themeColor, borderColor: themeColor }]}
                  onPress={() => toggleBillingChannel(ch)}
                >
                  <Text style={[styles.channelToggleText, active && { color: '#FFF' }, { fontSize: adjustSize(13) }]}>{ch}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.configDivider} />

          {/* SaaS pricing calculation card based on active leases count */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>{local('config_monetization')}</Text>
          <View style={styles.pricingCalcCard}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{local('active_rooms_count')}</Text>
              <Text style={styles.pricingValue}>{Database.getLeases().filter(l => l.status === 'active').length} {local('rooms_unit')}</Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{local('channel_type')}</Text>
              <Text style={styles.pricingValue}>{billingChannels.join(' + ') || 'None'}</Text>
            </View>
            
            {/* Calculate projected monthly ZBS invoice totals */}
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>{local('estimated_monthly_channel_cost')}</Text>
              <Text style={[styles.pricingValue, { color: themeColor, fontWeight: '800' }]}>
                {(() => {
                  const activeLeases = Database.getLeases().filter(l => l.status === 'active').length;
                  let ratePerNotice = 0;
                  if (billingChannels.includes('Zalo')) ratePerNotice += 300;
                  if (billingChannels.includes('SMS')) ratePerNotice += 800;
                  if (billingChannels.includes('Email')) ratePerNotice += 50;

                  const totalEstimatedCost = activeLeases * 2 * ratePerNotice;
                  return `${totalEstimatedCost.toLocaleString()} VND / tháng (~$${(totalEstimatedCost / 25000).toFixed(2)})`;
                })()}
              </Text>
            </View>
            <Text style={styles.pricingDisclaimer}>
              {local('pricing_terms')}
            </Text>
          </View>

          <View style={styles.configDivider} />

          {/* Part 2: Lease Expiration Warning settings */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(12) }]}>{local('lease_expiration_config')}</Text>
          <View style={styles.configItemRow}>
            <Text style={[styles.configItemLabel, { fontSize: adjustSize(14) }]}>{local('expiration_warning_days')}</Text>
            <TextInput
              style={styles.configNumberInput}
              keyboardType="numeric"
              value={leaseWarningDays}
              onChangeText={setLeaseWarningDays}
              maxLength={2}
            />
          </View>

          <Text style={[styles.configSubLabel, { fontSize: adjustSize(12) }]}>{local('lease_channels')}</Text>
          <View style={styles.channelsRow}>
            {['Zalo', 'SMS', 'Email'].map(ch => {
              const active = leaseChannels.includes(ch);
              return (
                <TouchableOpacity
                  key={ch}
                  style={[styles.channelToggle, active && { backgroundColor: themeColor, borderColor: themeColor }]}
                  onPress={() => toggleLeaseChannel(ch)}
                >
                  <Text style={[styles.channelToggleText, active && { color: '#FFF' }, { fontSize: adjustSize(13) }]}>{ch}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
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
  modalSend: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalForm: {
    flex: 1,
    padding: 16
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16
  },
  configItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7'
  },
  configItemLabel: {
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    paddingRight: 10
  },
  configNumberInput: {
    width: 60,
    height: 36,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  configSubLabel: {
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 10
  },
  channelsRow: {
    flexDirection: 'row',
    gap: 8
  },
  channelToggle: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  channelToggleText: {
    fontWeight: '700',
    color: '#1C1C1E'
  },
  configDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 20
  },
  pricingCalcCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginTop: 4
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  pricingLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600'
  },
  pricingValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700'
  },
  pricingDisclaimer: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 10
  }
});
