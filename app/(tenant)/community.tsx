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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Database, Tenant } from '../../services/Database';
import { AuthManager } from '../../services/AuthManager';
import { useLanguage } from '../../services/LanguageManager';
import { useEasyViewMode } from '../../services/EasyViewManager';
import { ProfileModal } from '../../components/ProfileModal';

interface CommunityMember {
  tenantId: string;
  name: string;
  phone: string;
  roomName: string;
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
              roomName: prop.name
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

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, { fontSize: adjustSize(16) }]}>
                {getInitials(item.name)}
              </Text>
            </View>
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
            {/* Call button */}
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => {
                Linking.openURL(`tel:${item.phone}`).catch(() => {
                  Alert.alert(
                    'Call Failed',
                    'Phone calls are not supported on this simulator/device.'
                  );
                });
              }}
            >
              <Text style={[styles.callBtnText, { fontSize: adjustSize(12) }]}>📞</Text>
            </TouchableOpacity>
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
    backgroundColor: '#34C75930',
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
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C75920',
    alignItems: 'center',
    justifyContent: 'center'
  },
  callBtnText: {
    fontSize: 18
  }
});
