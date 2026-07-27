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
  Animated,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { NoticeRepository, Notice, NoticeType } from '../../services/NoticeRepository';

export default function LandlordNotices() {
  const router = useRouter();
  const { logout } = useAuth();
  const { local } = useLanguage();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposeVisible, setIsComposeVisible] = useState(false);
  const [composeType, setComposeType] = useState<NoticeType>('info');
  const [composeBody, setComposeBody] = useState('');

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
    Alert.alert(
      local('delete'),
      local('delete_confirm_desc'),
      [
        { text: local('cancel'), style: 'cancel' },
        {
          text: local('delete'),
          style: 'destructive',
          onPress: async () => {
            await NoticeRepository.deleteNotice(id);
          }
        }
      ]
    );
  };

  const handleSendNotice = async () => {
    if (!composeBody.trim()) return;

    const title =
      composeType === 'fire'
        ? local('emergency_fire_alert')
        : composeType === 'urgent'
        ? local('urgent_notification')
        : local('property_notice');

    await NoticeRepository.addNotice(composeType, title, composeBody, 'Landlord');
    setComposeBody('');
    setComposeType('info');
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
    <SafeAreaView style={styles.container}>
      {/* Header View */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{local('announcements')}</Text>

        <TouchableOpacity style={styles.actionButton} onPress={() => setIsComposeVisible(true)}>
          <Text style={[styles.actionButtonText, { color: themeColor }]}>📝 {local('new_post')}</Text>
        </TouchableOpacity>
      </View>

      {/* Notices List */}
      <FlatList
        data={notices}
        keyExtractor={item => item.id}
        refreshing={isRefreshing}
        onRefresh={loadNotices}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>{local('no_announcements')}</Text>
            <Text style={styles.emptyDesc}>{local('no_announcements_desc')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stylesInfo = getCellStyles(item.type);
          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: stylesInfo.bg,
                  borderColor: stylesInfo.border,
                  borderWidth: item.type === 'info' ? 0 : 1.5
                }
              ]}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardEmoji}>
                    {item.type === 'fire' ? '🔥' : item.type === 'urgent' ? '⚡' : '📢'}
                  </Text>
                  <Text style={[styles.cardTitle, { color: stylesInfo.text }]}>{item.title}</Text>
                </View>
                <Text style={styles.cardTime}>
                  {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {/* Card Body */}
              <Text style={[styles.cardBody, { color: stylesInfo.text }]}>{item.body}</Text>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardSender}>
                  {local('sender_prefix')}{' '}
                  {item.senderName === 'Landlord' ? local('landlord') : item.senderName === 'Tenant' ? local('tenant') : item.senderName}
                </Text>

                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButton}>{local('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Compose Announcement Modal (Landlord) */}
      <Modal visible={isComposeVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsComposeVisible(false)}>
                <Text style={styles.modalCancel}>{local('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{local('compose_announcement')}</Text>
              <TouchableOpacity
                onPress={handleSendNotice}
                disabled={!composeBody.trim()}
                style={!composeBody.trim() && { opacity: 0.5 }}
              >
                <Text style={[styles.modalSend, { color: themeColor }]}>{local('send')}</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Form */}
            <ScrollView style={styles.modalForm}>
              <Text style={styles.sectionLabel}>{local('alert_level')}</Text>
              <View style={styles.segmentedContainer}>
                {(['info', 'urgent', 'fire'] as NoticeType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.segmentButton,
                      composeType === t && { backgroundColor: themeColor }
                    ]}
                    onPress={() => setComposeType(t)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        composeType === t && { color: '#FFF', fontWeight: '700' }
                      ]}
                    >
                      {t === 'info' ? '📢' : t === 'urgent' ? '⚡' : '🔥'}
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
  }
});
