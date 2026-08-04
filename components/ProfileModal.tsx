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
import { useEasyViewMode } from '../services/EasyViewManager';
import { NoticeRepository, Notice } from '../services/NoticeRepository';
import { PostDetailModal } from './PostDetailModal';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onPostClick?: (post: Notice) => void;
  user?: {
    name: string;
    phone: string;
    role: string;
    email?: string;
  };
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, onPostClick, user }) => {
  const { currentRole } = useAuth();
  const { local, language } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const [myNotices, setMyNotices] = useState<Notice[]>([]);
  const insets = useSafeAreaInsets();
  const [selectedPost, setSelectedPost] = useState<Notice | null>(null);

  // Mock profile details matching the roles or passed user
  const profileName = user ? user.name : (currentRole === 'landlord' ? local('landlord_name') : local('tenant_name'));
  const profilePhone = user ? user.phone : (currentRole === 'landlord' ? '0901234567' : '0909888777');
  const profileEmail = user?.email || (currentRole === 'landlord' ? 'landlord@rentify.vn' : 'jane.tenant@rentify.vn');
  const profileSub = user ? user.role : (currentRole === 'landlord' ? local('landlord_role') : local('tenant_role'));

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const loadMyNotices = () => {
    const allNotices = NoticeRepository.getNotices();
    const sender = user ? user.name : (currentRole === 'landlord' ? 'Landlord' : 'Tenant');
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
            <View style={[styles.avatar, { backgroundColor: '#007AFF15', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#007AFF', fontSize: adjustSize(28), fontWeight: '800' }}>
                {getInitials(profileName)}
              </Text>
            </View>
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
                  <Text style={[styles.postTitle, { fontSize: adjustSize(13) }]} numberOfLines={1}>{item.title}</Text>
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
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8
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
