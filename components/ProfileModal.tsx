//
//  ProfileModal.tsx
//  Rentify
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View as RNView, Platform } from 'react-native';
import { useAuth } from '../services/AuthManager';
import { useLanguage } from '../services/LanguageManager';
import { useElderlyMode } from '../services/AccessibilityManager';
import { NoticeRepository, Notice } from '../services/NoticeRepository';
import { PostDetailModal } from './PostDetailModal';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onPostClick?: (post: Notice) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, onPostClick }) => {
  const { currentRole } = useAuth();
  const { local, language } = useLanguage();
  const { adjustSize } = useElderlyMode();
  const [myNotices, setMyNotices] = useState<Notice[]>([]);
  const insets = useSafeAreaInsets();
  const [selectedPost, setSelectedPost] = useState<Notice | null>(null);

  // Mock profile details matching the roles
  const profileName = currentRole === 'landlord' ? local('landlord_name') : local('tenant_name');
  const profilePhone = currentRole === 'landlord' ? '0901234567' : '0909888777';
  const profileEmail = currentRole === 'landlord' ? 'landlord@rentify.vn' : 'jane.tenant@rentify.vn';
  const profileSub = currentRole === 'landlord' ? local('landlord_role') : local('tenant_role');
  const avatarUrl = currentRole === 'landlord' 
    ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

  const loadMyNotices = () => {
    const allNotices = NoticeRepository.getNotices();
    const sender = currentRole === 'landlord' ? 'Landlord' : 'Tenant';
    setMyNotices(allNotices.filter((n: Notice) => n.senderName === sender));
  };

  useEffect(() => {
    if (visible) {
      loadMyNotices();
      const unsubscribe = NoticeRepository.subscribe(() => {
        loadMyNotices();
      });
      return unsubscribe;
    }
  }, [visible, currentRole]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <RNView style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 12 : Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>{local('close')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: adjustSize(17) }]}>{local('profile')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.content}>
          {/* Section 1: Profile Information Card */}
          <View style={styles.profileCard}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { fontSize: adjustSize(18) }]}>{profileName}</Text>
              <Text style={[styles.profileSub, { fontSize: adjustSize(12) }]}>{profileSub}</Text>
              <Text style={[styles.profileDetails, { fontSize: adjustSize(12) }]}>📞 {profilePhone}</Text>
              <Text style={[styles.profileDetails, { fontSize: adjustSize(12) }]}>✉️ {profileEmail}</Text>
            </View>
          </View>

          {/* Section 2: Post History */}
          <Text style={[styles.sectionLabel, { fontSize: adjustSize(11) }]}>
            {local('post_history').toUpperCase()}
          </Text>

          <FlatList
            data={myNotices}
            keyExtractor={item => 'my-post-' + item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.postCard} 
                onPress={() => {
                  if (onPostClick) {
                    onPostClick(item);
                  } else {
                    setSelectedPost(item);
                  }
                }}
              >
                <View style={styles.postHeader}>
                  <Text style={[styles.postTitle, { fontSize: adjustSize(13) }]}>{item.title}</Text>
                  <Text style={styles.postTime}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.postBody, { fontSize: adjustSize(12) }]} numberOfLines={2}>
                  {item.body}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { fontSize: adjustSize(13) }]}>
                {local('no_posts')}
              </Text>
            }
          />
        </View>
        <PostDetailModal
          visible={selectedPost !== null}
          item={selectedPost}
          commenterName={currentRole === 'landlord' ? 'Landlord' : (language === 'vi' ? 'Cư dân - Phòng 102' : 'Resident - Room 102')}
          onClose={() => setSelectedPost(null)}
        />
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  title: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  content: {
    flex: 1,
    padding: 16
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5E5EA'
  },
  profileInfo: {
    flex: 1,
    gap: 5
  },
  profileName: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  profileSub: {
    fontWeight: '600',
    color: '#8E8E93'
  },
  profileDetails: {
    color: '#2C2C2E',
    fontWeight: '500'
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8
  },
  listContent: {
    paddingVertical: 8,
    gap: 12
  },
  postCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  postTitle: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  postTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600'
  },
  postBody: {
    color: '#2C2C2E',
    lineHeight: 16
  },
  emptyText: {
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20
  }
});
