//
//  notices.tsx
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
  ActionSheetIOS,
  Platform,
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { NoticeRepository, Notice, NoticeType } from '../../services/NoticeRepository';
import { FireConfirmationModal } from '../../components/FireConfirmationModal';
import { useElderlyMode } from '../../services/AccessibilityManager';
import { Database } from '../../services/Database';
import { FacebookPostCard } from '../../components/FacebookPostCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'react-native';

export default function LandlordNotices() {
  const router = useRouter();
  const { logout } = useAuth();
  const { local } = useLanguage();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposeVisible, setIsComposeVisible] = useState(false);
  const [composeType, setComposeType] = useState<NoticeType>('info');
  const [composeBody, setComposeBody] = useState('');
  const [isFireConfirmVisible, setIsFireConfirmVisible] = useState(false);

  // Configuration States (MVP Requirements)
  const [isConfigVisible, setIsConfigVisible] = useState(false);
  const [remindDay, setRemindDay] = useState('5');
  const [lateDays, setLateDays] = useState('3');
  const [billingChannels, setBillingChannels] = useState<string[]>(['Zalo', 'SMS']);
  const [leaseWarningDays, setLeaseWarningDays] = useState('14');
  const [leaseChannels, setLeaseChannels] = useState<string[]>(['Zalo', 'Email']);

  // Accessibilities & Social Profile States (Q3 & Q6)
  const { adjustSize } = useElderlyMode();
  const [selectedPosterName, setSelectedPosterName] = useState<string | null>(null);
  const [isPosterProfileVisible, setIsPosterProfileVisible] = useState(false);

  // New Compose visual states (media, title)
  const [composeTitle, setComposeTitle] = useState('');
  const insets = useSafeAreaInsets();
  const [composeMediaUri, setComposeMediaUri] = useState('');
  
  const canSend = composeTitle.trim() || composeBody.trim();

  const themeColor = '#007AFF'; // Blue theme for landlord

  const loadNotices = async () => {
    setIsRefreshing(true);
    const data = await NoticeRepository.fetchNotices();
    setNotices(data);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = NoticeRepository.subscribe(newNotices => {
      setNotices(newNotices);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: local('delete_confirm_desc'),
          options: [local('cancel'), local('delete')],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await NoticeRepository.deleteNotice(id);
          }
        }
      );
    } else {
      Alert.alert(
        local('delete'),
        local('delete_confirm_desc'),
        [
          { text: local('cancel'), style: 'cancel' },
          { text: local('delete'), style: 'destructive', onPress: async () => { await NoticeRepository.deleteNotice(id); } }
        ]
      );
    }
  };

  const toggleBillingChannel = (channel: string) => {
    setBillingChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const toggleLeaseChannel = (channel: string) => {
    setLeaseChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleSendNotice = async () => {
    if (!composeBody.trim()) return;

    if (composeType === 'fire') {
      setIsFireConfirmVisible(true);
      return;
    }

    await submitNotice();
  };

  const submitNotice = async () => {
    const title = composeTitle.trim() || (
      composeType === 'fire'
        ? local('emergency_fire_alert')
        : composeType === 'urgent'
        ? local('urgent_notification')
        : local('property_notice')
    );

    await NoticeRepository.addNotice(
      composeType, 
      title, 
      composeBody, 
      'Landlord',
      new Date(),
      composeMediaUri || undefined,
      true // Landlord posts are auto-approved
    );
    setComposeTitle('');
    setComposeBody('');
    setComposeType('info');
    setComposeMediaUri('');
    setIsComposeVisible(false);
  };

  const getCellStyles = (type: NoticeType) => {
    switch (type) {
      case 'fire':
        return { bg: '#FF3B3014', border: '#FF3B30', text: '#FF3B30', badgeBg: '#FF3B3026' };
      case 'urgent':
        return { bg: '#FF950014', border: '#FF9500', text: '#FF9500', badgeBg: '#FF950026' };
      default:
        return { bg: '#F2F2F7', border: 'transparent', text: '#1C1C1E', badgeBg: '#007AFF26' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header View */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{local('announcements')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.configActionBtn} onPress={() => setIsConfigVisible(true)}>
            <Text style={styles.configActionText}>{local('billing_config')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setIsComposeVisible(true)}>
            <Text style={[styles.actionButtonText, { color: themeColor }]}>📝 {local('new_post')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notices List */}
      <FlatList
        data={notices.filter(n => n.approved)}
        keyExtractor={item => item.id}
        refreshing={isRefreshing}
        onRefresh={loadNotices}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => {
          const pendingNotices = notices.filter(n => !n.approved);
          if (pendingNotices.length === 0) return null;
          return (
            <View style={styles.moderatorSection}>
              <Text style={[styles.moderatorTitle, { fontSize: adjustSize(15) }]}>{local('notices_approval_requests')} ({pendingNotices.length})</Text>
              {pendingNotices.map(item => (
                <View key={item.id} style={styles.pendingCard}>
                  <View style={styles.pendingHeader}>
                    <Text style={[styles.pendingAuthor, { fontSize: adjustSize(12) }]}>👤 {item.senderName === 'Tenant' ? local('tenant') : item.senderName}</Text>
                    <Text style={styles.pendingTime}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.pendingPostTitle, { fontSize: adjustSize(13) }]}>{item.title}</Text>
                  <Text style={[styles.pendingBody, { fontSize: adjustSize(12) }]} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity 
                      style={styles.approveBtn} 
                      onPress={() => NoticeRepository.approveNotice(item.id)}
                    >
                      <Text style={styles.approveBtnText}>{local('approve')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.rejectBtn} 
                      onPress={() => NoticeRepository.deleteNotice(item.id)}
                    >
                      <Text style={styles.rejectBtnText}>{local('reject')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.moderatorDivider} />
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>{local('no_announcements')}</Text>
            <Text style={styles.emptyDesc}>{local('no_announcements_desc')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FacebookPostCard
            item={item}
            commenterName="Landlord"
            onPosterClick={(senderName) => {
              setSelectedPosterName(senderName);
              setIsPosterProfileVisible(true);
            }}
            onDeleteClick={handleDelete}
          />
        )}
      />

      {/* ─── Configuration Modal (Missing MVP requirement) ─── */}
      <Modal 
        visible={isConfigVisible} 
        animationType="slide" 
        transparent
        onRequestClose={() => setIsConfigVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsConfigVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Cấu Hình Thông Báo</Text>
              <TouchableOpacity onPress={() => {
                Alert.alert(local('notification_config_success'), local('notification_config_success_desc'));
                setIsConfigVisible(false);
              }}>
                <Text style={[styles.modalSend, { color: themeColor }]}>{local('save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              
              {/* Part 1: billing settings */}
              <Text style={styles.sectionLabel}>{local('billing_reminders_config')}</Text>
              <View style={styles.configItemRow}>
                <Text style={styles.configItemLabel}>{local('billing_day_label')}</Text>
                <TextInput
                  style={styles.configNumberInput}
                  keyboardType="numeric"
                  value={remindDay}
                  onChangeText={setRemindDay}
                  maxLength={2}
                />
              </View>
              
              <View style={styles.configItemRow}>
                <Text style={styles.configItemLabel}>{local('late_billing_days')}</Text>
                <TextInput
                  style={styles.configNumberInput}
                  keyboardType="numeric"
                  value={lateDays}
                  onChangeText={setLateDays}
                  maxLength={2}
                />
              </View>

              <Text style={styles.configSubLabel}>{local('notification_channels')}</Text>
              <View style={styles.channelsRow}>
                {['Zalo', 'SMS', 'Email'].map(ch => {
                  const active = billingChannels.includes(ch);
                  return (
                    <TouchableOpacity
                      key={ch}
                      style={[styles.channelToggle, active && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => toggleBillingChannel(ch)}
                    >
                      <Text style={[styles.channelToggleText, active && { color: '#FFF' }]}>{ch}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.configDivider} />

              {/* SaaS pricing calculation card based on active leases count (Q7 requirement) */}
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

                      // assume average of 2 notifications sent per active tenant monthly
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

              {/* Part 2: Lease Warning settings */}
              <Text style={styles.sectionLabel}>{local('lease_expiration_config')}</Text>
              <View style={styles.configItemRow}>
                <Text style={styles.configItemLabel}>{local('expiration_warning_days')}</Text>
                <TextInput
                  style={styles.configNumberInput}
                  keyboardType="numeric"
                  value={leaseWarningDays}
                  onChangeText={setLeaseWarningDays}
                  maxLength={2}
                />
              </View>

              <Text style={styles.configSubLabel}>{local('lease_channels')}</Text>
              <View style={styles.channelsRow}>
                {['Zalo', 'SMS', 'Email'].map(ch => {
                  const active = leaseChannels.includes(ch);
                  return (
                    <TouchableOpacity
                      key={ch}
                      style={[styles.channelToggle, active && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => toggleLeaseChannel(ch)}
                    >
                      <Text style={[styles.channelToggleText, active && { color: '#FFF' }]}>{ch}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Poster Profile Modal (Q6 requirement) ─── */}
      <Modal 
        visible={isPosterProfileVisible} 
        animationType="slide" 
        presentationStyle="pageSheet"
        transparent={false}
        onRequestClose={() => setIsPosterProfileVisible(false)}
      >
        <RNView style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 12 : Math.max(insets.top, 12) }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsPosterProfileVisible(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{local('profile')}</Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Profile Content */}
          <View style={{ padding: 16 }}>
            <View style={styles.posterHeaderCard}>
              <View style={styles.posterAvatar}>
                <Text style={styles.posterAvatarText}>
                  {selectedPosterName === 'Landlord' ? '🏡' : '👤'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.posterName}>
                  {selectedPosterName === 'Landlord' ? local('landlord') : local('tenant')}
                </Text>
                <Text style={styles.posterSub}>
                  {selectedPosterName === 'Landlord' ? local('property_manager') : local('resident_linked')}
                </Text>
                <Text style={styles.posterContact}>📞 {selectedPosterName === 'Landlord' ? '0901234567' : '0909888777'}</Text>
              </View>
            </View>

            {/* Poster Past Notices */}
            <Text style={styles.posterSectionTitle}>{local('past_posts')}</Text>
            <FlatList
              data={notices.filter(n => n.senderName === selectedPosterName)}
              keyExtractor={item => 'post-' + item.id}
              style={{ marginTop: 8, maxHeight: '60%' }}
              renderItem={({ item }) => (
                <View style={styles.posterPostCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.posterPostTitle}>{item.title}</Text>
                    <Text style={styles.posterPostTime}>
                      {item.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.posterPostBody} numberOfLines={2}>{item.body}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: '#8E8E93', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                  {local('no_other_posts')}
                </Text>
              }
            />
          </View>
        </RNView>
      </Modal>

      {/* Compose Announcement Modal (Landlord) */}
      <Modal 
        visible={isComposeVisible} 
        animationType="slide" 
        transparent
        onRequestClose={() => setIsComposeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsComposeVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{local('compose_announcement')}</Text>
              <TouchableOpacity
                onPress={handleSendNotice}
                disabled={!canSend}
                style={!canSend && { opacity: 0.5 }}
              >
                <Text style={[styles.modalSend, { color: themeColor }]}>{local('send')}</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <ScrollView style={styles.modalForm}>
              <Text style={[styles.sectionLabel, { fontSize: adjustSize(13) }]}>{local('post_title')}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, { fontSize: adjustSize(14) }]}
                  placeholder={local('enter_title_placeholder')}
                  placeholderTextColor="#8E8E93"
                  value={composeTitle}
                  onChangeText={setComposeTitle}
                />
              </View>



              <Text style={[styles.sectionLabel, { fontSize: adjustSize(13) }]}>{local('attach_media')}</Text>
              <TouchableOpacity
                style={styles.mediaAttachBtn}
                onPress={() => {
                  setComposeMediaUri(prev => prev ? '' : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600');
                }}
              >
                <Text style={[styles.mediaAttachBtnText, { fontSize: adjustSize(13) }]}>
                  {composeMediaUri ? local('remove_attachment') : local('select_mock_image')}
                </Text>
              </TouchableOpacity>
              {composeMediaUri ? (
                <Image source={{ uri: composeMediaUri }} style={styles.mediaAttachPreview} />
              ) : null}

              <Text style={[styles.sectionLabel, { fontSize: adjustSize(13) }]}>{local('alert_level')}</Text>
              <View style={styles.segmentedListContainer}>
                {(['info', 'urgent', 'fire'] as NoticeType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.segmentedListItem,
                      composeType === t && { backgroundColor: themeColor + '1C', borderColor: themeColor }
                    ]}
                    onPress={() => setComposeType(t)}
                  >
                    <Text
                      style={[
                        styles.segmentedListText,
                        { fontSize: adjustSize(13) },
                        composeType === t && { color: themeColor, fontWeight: '800' }
                      ]}
                    >
                      {t === 'info' ? `📢 ${local('normal_level')}` : t === 'urgent' ? `⚡ ${local('urgent_level')}` : `🔥 ${local('fire_level')}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>{local('message_content')}</Text>
              <View style={styles.editorContainer}>
                <TextInput
                  style={styles.editor}
                  placeholder={local('enter_desc')}
                  placeholderTextColor="#8E8E93"
                  multiline
                  value={composeBody}
                  onChangeText={setComposeBody}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FireConfirmationModal
        visible={isFireConfirmVisible}
        onClose={() => setIsFireConfirmVisible(false)}
        onConfirm={submitNotice}
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 12
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 12
  },
  actionButtonText: {
    fontSize: 13,
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
    paddingVertical: 100,
    paddingHorizontal: 40
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
    textAlign: 'center',
    lineHeight: 20
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F2F2F7'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  cardEmoji: {
    fontSize: 18,
    marginRight: 6
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  cardTime: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500'
  },
  cardBody: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 12
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93'
  },
  deleteButton: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B30'
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
  modalSend: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalForm: {
    padding: 16
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16
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
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  segmentText: {
    fontSize: 14
  },
  editorContainer: {
    minHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 12
  },
  editor: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 100
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  configActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 10
  },
  configActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93'
  },
  // Config Modal Specific Styles
  configItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7'
  },
  configItemLabel: {
    fontSize: 14,
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
    fontWeight: '700',
    color: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: '#E5E5EA'
  },
  configSubLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8
  },
  channelsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  channelToggle: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFF'
  },
  channelToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93'
  },
  configDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 20
  },
  inputBoxRow: {
    flexDirection: 'row',
    minHeight: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E'
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  dateChevron: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '300',
    transform: [{ rotate: '90deg' }]
  },
  dateChevronOpen: {
    transform: [{ rotate: '-90deg' }]
  },
  pickerWrapper: {
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  mediaAttachBtn: {
    height: 48,
    backgroundColor: '#007AFF1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#007AFF'
  },
  mediaAttachBtnText: {
    fontWeight: '700',
    color: '#007AFF'
  },
  mediaAttachPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F2F2F7'
  },
  // Redesigned Compose Category alignment styles
  segmentedListContainer: {
    gap: 8,
    marginBottom: 16
  },
  segmentedListItem: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  segmentedListText: {
    fontWeight: '700',
    color: '#8E8E93'
  },
  // SaaS Pricing Calc styles
  pricingCalcCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pricingLabel: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600'
  },
  pricingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C2C2E'
  },
  pricingDisclaimer: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16
  },
  // Clickable sender styles
  senderContainer: {
    paddingVertical: 2
  },
  // Poster profile card styles
  posterHeaderCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  posterAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF1A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  posterAvatarText: {
    fontSize: 24
  },
  posterName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  posterSub: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600'
  },
  posterContact: {
    fontSize: 12,
    color: '#2C2C2E',
    fontWeight: '500',
    marginTop: 4
  },
  posterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  posterPostCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  posterPostTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  posterPostTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600'
  },
  posterPostBody: {
    fontSize: 12,
    color: '#2C2C2E',
    marginTop: 4,
    lineHeight: 16
  },
  moderatorSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FF950040',
    marginBottom: 16,
    gap: 12
  },
  moderatorTitle: {
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 4
  },
  pendingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF950020'
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  pendingAuthor: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  pendingTime: {
    fontSize: 10,
    color: '#8E8E93'
  },
  pendingPostTitle: {
    fontWeight: '800',
    color: '#2C2C2E',
    marginBottom: 2
  },
  pendingBody: {
    color: '#8E8E93',
    lineHeight: 16,
    marginBottom: 12
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 12
  },
  approveBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  approveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 12
  },
  rejectBtn: {
    flex: 1,
    height: 36,
    backgroundColor: '#FF3B301A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontWeight: '800',
    fontSize: 12
  },
  moderatorDivider: {
    height: 1,
    backgroundColor: '#FF950020',
    marginTop: 4
  },
  inputBox: {
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 16
  },
  textInput: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600'
  }
});
