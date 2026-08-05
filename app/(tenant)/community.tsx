//
//  community.tsx
//  Rentify
//
//  Created by Tin Pham on 4/8/26.
//

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database, Tenant } from '../../services/Database';
import { getInitials } from '../../services/nameUtils';
import { AuthManager } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { ProfileModal } from '../../components/ProfileModal';

const zaloIcon = require('../../assets/zalo_icon.png');

interface CommunityMember {
  tenantId: string;
  name: string;
  phone: string;
  roomName: string;
  photoUri?: string;
  zalo?: string;
}

// Mask phone: 0901******5
const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 6) return phone;
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.substring(0, 4) + '***' + cleaned.substring(cleaned.length - 2);
};

export default function TenantCommunity() {
  const { local } = useLanguage();
  const { adjustSize } = useEasyViewMode();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const insets = useSafeAreaInsets();

  const loadMembers = () => {
    const loggedInId = AuthManager.getLoggedInTenantId();
    const allLeases = Database.getLeases();
    const allProperties = Database.getProperties();
    const allTenants = Database.getTenants();

    // Find khuTroId for logged-in tenant's active lease
    const myLease = allLeases.find(l => l.tenantId === loggedInId && l.status === 'active');
    if (!myLease) {
      setMembers([]);
      return;
    }
    const myProperty = allProperties.find(p => p.id === myLease.propertyId);
    if (!myProperty) {
      setMembers([]);
      return;
    }
    const myKhuTroId = myProperty.khuTroId;

    // Get all properties in same khu
    const khuPropertyIds = allProperties
      .filter(p => p.khuTroId === myKhuTroId)
      .map(p => p.id);

    // Get all active leases in those properties (exclude self)
    const communityMembers: CommunityMember[] = [];
    allLeases
      .filter(l => khuPropertyIds.includes(l.propertyId) && l.status === 'active' && l.tenantId !== loggedInId)
      .forEach(l => {
        const tenant = allTenants.find(t => t.id === l.tenantId);
        const prop = allProperties.find(p => p.id === l.propertyId);
        if (tenant && prop) {
          // Avoid duplicates
          if (!communityMembers.find(m => m.tenantId === tenant.id)) {
            communityMembers.push({
              tenantId: tenant.id,
              name: tenant.name,
              phone: tenant.phone,
              roomName: prop.name,
              photoUri: tenant.photoUri,
              zalo: tenant.zalo
            });
          }
        }
      });

    setMembers(communityMembers);
  };

  useEffect(() => {
    const unsub = Database.subscribe(loadMembers);
    loadMembers();
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: adjustSize(20) }]}>
          {local('community_title')}
        </Text>
      </View>

      <FlatList
        data={members}
        keyExtractor={item => item.tenantId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          members.length > 0 ? (
            <Text style={[styles.subTitle, { fontSize: adjustSize(13) }]}>
              {local('community_desc')}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyIcon}>🏘️</Text>
            <Text style={[styles.emptyTitle, { fontSize: adjustSize(16) }]}>{local('community_empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setSelectedMember(item)}
          >
            {/* Avatar */}
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={[styles.avatarText, { fontSize: adjustSize(16) }]}>
                  {getInitials(item.name)}
                </Text>
              </View>
            )}
            {/* Info */}
            <View style={styles.info}>
              <Text style={[styles.name, { fontSize: adjustSize(15) }]}>{item.name}</Text>
              <Text style={[styles.room, { fontSize: adjustSize(12) }]}>
                {local('room_label')}: {item.roomName}
              </Text>
              <Text style={[styles.phone, { fontSize: adjustSize(12) }]}>
                📞 {maskPhone(item.phone)}
              </Text>
            </View>
            {/* Contact actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.zaloBtn}
                accessibilityLabel={local('zalo_chat')}
                onPress={() => {
                  const target = (item.zalo || item.phone).replace(/\D/g, '');
                  Linking.openURL(`https://zalo.me/${target}`).catch(() => {
                    Alert.alert(local('zalo_chat'), local('call_failed_desc'));
                  });
                }}
              >
                <Image source={zaloIcon} style={styles.zaloIcon} resizeMode="contain" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callBtn}
                accessibilityLabel={local('call_action')}
                onPress={() => {
                  Linking.openURL(`tel:${item.phone}`).catch(() => {
                    Alert.alert(
                      local('call_failed_title'),
                      local('call_failed_desc')
                    );
                  });
                }}
              >
                <Text style={[styles.actionIcon, { fontSize: adjustSize(12) }]}>📞</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        user={selectedMember ? {
          name: selectedMember.name,
          phone: selectedMember.phone,
          zalo: selectedMember.zalo || selectedMember.phone,
          role: local('tenant_role') || 'Tenant'
        } : undefined}
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
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  subTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12
  },
  emptyView: {
    alignItems: 'center',
    paddingTop: 80
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center'
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#34C75930'
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34C759'
  },
  info: {
    flex: 1,
    gap: 2
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  room: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500'
  },
  phone: {
    fontSize: 12,
    color: '#8E8E93'
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  zaloBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0068FF15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  zaloIcon: {
    width: 28,
    height: 28,
    borderRadius: 6
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C75920',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIcon: {
    fontSize: 18
  }
});
