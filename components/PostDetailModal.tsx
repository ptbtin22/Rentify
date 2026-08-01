//
//  PostDetailModal.tsx
//  Rentify
//

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notice } from '../services/NoticeRepository';
import { useLanguage } from '../services/LanguageManager';
import { useElderlyMode } from '../services/AccessibilityManager';
import { FacebookPostCard } from './FacebookPostCard';

interface PostDetailModalProps {
  visible: boolean;
  item: Notice | null;
  onClose: () => void;
  commenterName: string;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  visible,
  item,
  onClose,
  commenterName
}) => {
  const { local } = useLanguage();
  const { adjustSize } = useElderlyMode();
  const insets = useSafeAreaInsets();

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 12 : Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>{local('close')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { fontSize: adjustSize(16) }]}>{local('post_details')}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.modalScroll}>
          <FacebookPostCard
            item={item}
            commenterName={commenterName}
            onPosterClick={() => {}}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    fontWeight: '800',
    color: '#1C1C1E'
  },
  modalScroll: {
    padding: 16,
    backgroundColor: '#FFF'
  }
});
