//
//  FacebookPostCard.tsx
//  Rentify
//

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Vibration
} from 'react-native';
import { Notice, NoticeRepository } from '../services/NoticeRepository';
import { useLanguage } from '../services/LanguageManager';
import { useEasyViewMode } from '../services/EasyViewManager';

interface FacebookPostCardProps {
  item: Notice;
  commenterName: string;
  onPosterClick: (senderName: string) => void;
  onDeleteClick?: (id: string) => void;
}

export const FacebookPostCard: React.FC<FacebookPostCardProps> = ({
  item,
  commenterName,
  onPosterClick,
  onDeleteClick
}) => {
  const { local } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    Vibration.vibrate(40);
    NoticeRepository.likeNotice(item.id);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    NoticeRepository.addComment(item.id, commenterName, commentText.trim());
    setCommentText('');
    Keyboard.dismiss();
  };

  // Determine avatar icon and category badge styling
  const isLandlord = item.senderName === 'Landlord';
  const displayName = isLandlord ? local('landlord') : item.senderName;
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const categoryLabel = 
    item.type === 'fire' 
      ? local('fire_level') 
      : item.type === 'urgent' 
        ? local('urgent_level') 
        : local('normal_level');

  const categoryColor = 
    item.type === 'fire' 
      ? '#FF3B30' 
      : item.type === 'urgent' 
        ? '#FF9500' 
        : '#007AFF';

  return (
    <View style={styles.card}>
      {/* 1. Header row */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onPosterClick(item.senderName)}>
          <View style={[styles.avatar, { backgroundColor: '#007AFF15', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#007AFF', fontSize: adjustSize(16), fontWeight: '800' }}>
              {getInitials(displayName)}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={() => onPosterClick(item.senderName)}>
            <Text style={[styles.posterName, { fontSize: adjustSize(14) }]}>
              {displayName}
            </Text>
          </TouchableOpacity>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
            </Text>
            <View style={[styles.badge, { backgroundColor: categoryColor + '15', borderColor: categoryColor }]}>
              <Text style={[styles.badgeText, { color: categoryColor, fontSize: adjustSize(9) }]}>
                {categoryLabel}
              </Text>
            </View>
          </View>
        </View>
        {onDeleteClick && (
          <TouchableOpacity onPress={() => onDeleteClick(item.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Post content */}
      <Text style={[styles.postTitle, { fontSize: adjustSize(15) }]}>{item.title}</Text>
      <Text style={[styles.postBody, { fontSize: adjustSize(13) }]}>{item.body}</Text>

      {/* 3. Image attachments (simulating media upload) */}
      {item.mediaUri && (
        <Image source={{ uri: item.mediaUri }} style={styles.mediaImage} />
      )}

      {/* 4. Likes & Comments count summary */}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryText, { fontSize: adjustSize(11) }]}>
          👍 {item.likes} {local('like')}
        </Text>
        <Text style={[styles.summaryText, { fontSize: adjustSize(11) }]}>
          💬 {item.comments.length} {local('comments')}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 5. Action Buttons (Like / Comment) */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Text style={[styles.actionBtnText, item.likedByMe && { color: categoryColor, fontWeight: '800' }, { fontSize: adjustSize(13) }]}>
            👍 {local('like')}
          </Text>
        </TouchableOpacity>
        <View style={styles.btnDivider} />
        <View style={styles.actionBtn}>
          <Text style={[styles.actionBtnText, { fontSize: adjustSize(13) }]}>💬 {local('comment')}</Text>
        </View>
      </View>

      {/* 6. Comments Feed */}
      {item.comments.length > 0 && (
        <View style={styles.commentsList}>
          {item.comments.map(c => (
            <View key={c.id} style={styles.commentBubble}>
              <Text style={styles.commentSender}>
                {c.senderName === 'Landlord' ? local('landlord') : c.senderName}
              </Text>
              <Text style={[styles.commentBody, { fontSize: adjustSize(12) }]}>{c.body}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 7. New Comment Input Box */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder={local('write_comment')}
          placeholderTextColor="#8E8E93"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={[styles.commentSendBtn, { backgroundColor: categoryColor }]} onPress={handleSendComment}>
          <Text style={styles.commentSendText}>{local('send_comment')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    marginRight: 12
  },
  headerInfo: {
    flex: 1,
    gap: 2
  },
  posterName: {
    fontWeight: '800',
    color: '#1C1C1E'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metaText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500'
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeText: {
    fontWeight: '700'
  },
  deleteBtn: {
    padding: 8
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500'
  },
  postTitle: {
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4
  },
  postBody: {
    color: '#2C2C2E',
    lineHeight: 18,
    marginBottom: 12
  },
  mediaImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryText: {
    color: '#8E8E93',
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginBottom: 8
  },
  actionsBar: {
    flexDirection: 'row',
    height: 36,
    alignItems: 'center'
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: '100%'
  },
  actionBtnText: {
    fontWeight: '700',
    color: '#8E8E93'
  },
  btnDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E5EA'
  },
  commentsList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginTop: 12
  },
  commentBubble: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'flex-start'
  },
  commentSender: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 2
  },
  commentBody: {
    color: '#2C2C2E',
    fontWeight: '500'
  },
  commentInputRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8
  },
  commentInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1C1C1E'
  },
  commentSendBtn: {
    width: 52,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commentSendText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
