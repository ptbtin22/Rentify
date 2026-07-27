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
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { NoticeRepository, Notice, NoticeType } from '../../services/NoticeRepository';
import { NotificationManager } from '../../services/NotificationManager';

export default function TenantNotices() {
  const router = useRouter();
  const { logout } = useAuth();
  const { local } = useLanguage();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Emergency In-App Banner State
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [emergencyText, setEmergencyText] = useState('');
  const bannerY = useState(new Animated.Value(-150))[0];

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
    Alert.alert(
      local('confirm_fire_alert'),
      local('fire_alert_desc'),
      [
        { text: local('cancel'), style: 'cancel' },
        {
          text: local('activate_alarm'),
          style: 'destructive',
          onPress: async () => {
            await NoticeRepository.addNotice(
              'fire',
              local('emergency_fire_alert'),
              local('fire_alert_message'),
              'Tenant'
            );
            // Trigger native OS push notification banner
            await NotificationManager.triggerLocalNotification(
              '🔥 ' + local('emergency_fire_alert'),
              local('fire_alert_message')
            );
          }
        }
      ]
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
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>{local('bulletin_board')}</Text>

        <TouchableOpacity style={styles.fireButton} onPress={handleReportFire}>
          <Text style={styles.fireButtonText}>🔥 {local('report_fire')}</Text>
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
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>{local('bulletin_empty')}</Text>
            <Text style={styles.emptyDesc}>{local('bulletin_empty_desc')}</Text>
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

                <View style={[styles.typeBadge, { backgroundColor: stylesInfo.badgeBg }]}>
                  <Text style={[styles.typeBadgeText, { color: stylesInfo.text }]}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FF3B301A',
    borderRadius: 12
  },
  fireButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
  }
});
