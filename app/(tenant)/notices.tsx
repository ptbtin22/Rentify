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
  Alert,
  Animated,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Platform
} from 'react-native';
import { useElderlyMode } from '../../services/AccessibilityManager';
import { Database } from '../../services/Database';
import { useLanguage } from '../../services/LanguageManager';
import { FacebookPostCard } from '../../components/FacebookPostCard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { NoticeRepository, Notice, NoticeType } from '../../services/NoticeRepository';
import { NotificationManager } from '../../services/NotificationManager';
import { FireConfirmationModal } from '../../components/FireConfirmationModal';

export default function TenantNotices() {
  const router = useRouter();
  const { logout } = useAuth();
  const { local } = useLanguage();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Accessibility & Profile States (Q3 & Q6)
  const { adjustSize } = useElderlyMode();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const getTenantSenderName = () => {
    const leases = Database.getLeases();
    const properties = Database.getProperties();
    const myLeases = leases.filter(l => l.tenantId === 'tenant-1' && l.status === 'active');
    if (myLeases.length > 0) {
      const p = properties.find(prop => prop.id === myLeases[0].propertyId);
      if (p) {
        return language === 'vi' ? `Cư dân - ${p.name}` : `Resident - ${p.name}`;
      }
    }
    return language === 'vi' ? 'Cư dân - Phòng 102' : 'Resident - Room 102';
  };
  const [selectedPosterName, setSelectedPosterName] = useState<string | null>(null);
  const [isPosterProfileVisible, setIsPosterProfileVisible] = useState(false);

  // Tenant Post Compose States
  const [isComposeVisible, setIsComposeVisible] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeType, setComposeType] = useState<NoticeType>('info');
  const [composeMediaUri, setComposeMediaUri] = useState('');

  const canSend = composeTitle.trim() || composeBody.trim();

  const handleSendNotice = async () => {
    if (!canSend) return;
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

    // Add notice with approved: false since it is created by a tenant
    await NoticeRepository.addNotice(
      composeType,
      title,
      composeBody,
      getTenantSenderName(),
      new Date(),
      composeMediaUri || undefined,
      false // Pending landlord moderator review!
    );

    Alert.alert(
      'Gửi thành công',
      'Bài viết đã được gửi đi và đang chờ quản trị viên (chủ nhà) duyệt trước khi hiển thị trên bảng tin.'
    );

    setComposeTitle('');
    setComposeBody('');
    setComposeType('info');
    setComposeMediaUri('');
    setIsComposeVisible(false);
  };

  // Emergency In-App Banner State
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [emergencyText, setEmergencyText] = useState('');
  const bannerY = useState(new Animated.Value(-150))[0];
  const [isFireConfirmVisible, setIsFireConfirmVisible] = useState(false);

  const themeColor = '#34C759'; // Green theme for tenant

  const loadNotices = async () => {
    setIsRefreshing(true);
    const data = await NoticeRepository.fetchNotices();
    setNotices(data);
    setIsRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = NoticeRepository.subscribe(newNotices => {
      setNotices(newNotices);
      
      // If the latest notice is a fire emergency, trigger the slide-down warning banner
      if (newNotices.length > 0 && newNotices[0].type === 'fire') {
        const latest = newNotices[0];
        triggerEmergencyBanner(latest.body);
      }
    });
    return unsubscribe;
  }, []);

  const triggerEmergencyBanner = (text: string) => {
    setEmergencyText(text);
    setShowEmergencyBanner(true);
    Animated.sequence([
      Animated.timing(bannerY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true
      }),
      Animated.delay(4000),
      Animated.timing(bannerY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowEmergencyBanner(false);
    });
  };

  const handleReportFire = () => {
    setIsFireConfirmVisible(true);
  };

  const handleConfirmFire = async () => {
    await NoticeRepository.addNotice(
      'fire',
      local('emergency_fire_alert'),
      local('fire_alert_message'),
      getTenantSenderName()
    );
    // Trigger native OS push notification banner
    await NotificationManager.triggerLocalNotification(
      '🔥 ' + local('emergency_fire_alert'),
      local('fire_alert_message')
    );
  };

  const getCellStyles = (type: NoticeType) => {
    switch (type) {
      case 'fire':
        return { bg: '#FF3B3014', border: '#FF3B30', text: '#FF3B30', badgeBg: '#FF3B3026' };
      case 'urgent':
        return { bg: '#FF950014', border: '#FF9500', text: '#FF9500', badgeBg: '#FF950026' };
      default:
        return { bg: '#F2F2F7', border: 'transparent', text: '#1C1C1E', badgeBg: '#34C75926' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Sliding Emergency Warning Banner */}
      {showEmergencyBanner && (
        <Animated.View style={[styles.emergencyBanner, { transform: [{ translateY: bannerY }] }]}>
          <Text style={styles.emergencyIcon}>🔥</Text>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>{local('emergency_fire_alert')}</Text>
            <Text style={styles.emergencyBody}>{emergencyText}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header View */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(18) }]}>{local('bulletin_board')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setIsComposeVisible(true)}
            accessibilityLabel={local('new_post')}
          >
            <Text style={[styles.actionButtonText, { color: themeColor, fontSize: adjustSize(16) }]}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fireButton} 
            onPress={handleReportFire}
            accessibilityLabel={local('report_fire')}
          >
            <Text style={[styles.fireButtonText, { fontSize: adjustSize(16) }]}>🔥</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>{local('bulletin_empty')}</Text>
            <Text style={styles.emptyDesc}>{local('bulletin_empty_desc')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FacebookPostCard
            item={item}
            commenterName={getTenantSenderName()}
            onPosterClick={(senderName) => {
              setSelectedPosterName(senderName);
              setIsPosterProfileVisible(true);
            }}
          />
        )}
      />

      <FireConfirmationModal
        visible={isFireConfirmVisible}
        onClose={() => setIsFireConfirmVisible(false)}
        onConfirm={handleConfirmFire}
      />

      {/* ─── Tenant Announcement Compose Modal ─── */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  emergencyBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    height: 80,
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: 12
  },
  emergencyContent: {
    flex: 1
  },
  emergencyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800'
  },
  emergencyBody: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2
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
  fireButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B301A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fireButtonText: {
    fontSize: 16,
    color: '#FF3B30'
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
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '900'
  },
  senderContainer: {
    paddingVertical: 2
  },
  // Modal standard Header styles
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
    backgroundColor: '#34C7591A',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C7591A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtonText: {
    fontSize: 16
  },
  // Modal overlay form styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%'
  },
  modalSend: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalForm: {
    padding: 16
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8
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
  },
  mediaAttachBtn: {
    height: 48,
    backgroundColor: '#34C7591A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#34C759'
  },
  mediaAttachBtnText: {
    fontWeight: '700',
    color: '#34C759'
  },
  mediaAttachPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F2F2F7'
  },
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
  editorContainer: {
    minHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 40
  },
  editor: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    minHeight: 100
  }
});
