//
//  ContractImageViewer.tsx — full-screen zoom + download for contract photos
//

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../services/LanguageManager';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ContractImageViewerProps {
  visible: boolean;
  uris: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ContractImageViewer: React.FC<ContractImageViewerProps> = ({
  visible,
  uris,
  initialIndex = 0,
  onClose
}) => {
  const { local, localF } = useLanguage();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const safe = Math.max(0, Math.min(initialIndex, Math.max(0, uris.length - 1)));
    setIndex(safe);
    // Jump pager after open
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: safe * SCREEN_W, animated: false });
    });
  }, [visible, initialIndex, uris.length]);

  const onPagerEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(idx);
  };

  const handleDownload = async () => {
    const uri = uris[index];
    if (!uri) return;

    if (Platform.OS === 'web') {
      try {
        // Open remote image in a new tab so the user can save it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = (globalThis as any).open?.(uri, '_blank');
        if (!win) {
          Alert.alert(local('download_failed_title'), local('download_failed_desc'));
        } else {
          Alert.alert(local('download_ready_title'), local('download_ready_web_desc'));
        }
      } catch {
        Alert.alert(local('download_failed_title'), local('download_failed_desc'));
      }
      return;
    }

    setSaving(true);
    try {
      // Local file URIs (just uploaded) can be shared directly
      let localUri = uri;
      if (/^https?:\/\//i.test(uri)) {
        const extMatch = uri.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i);
        const ext = extMatch ? extMatch[0] : '.jpg';
        const dest = `${FileSystem.cacheDirectory}contract-${Date.now()}${ext}`;
        const result = await FileSystem.downloadAsync(uri, dest);
        localUri = result.uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/jpeg',
          dialogTitle: local('download_contract_photo')
        });
      } else {
        Alert.alert(local('download_ready_title'), local('download_ready_desc'));
      }
    } catch {
      Alert.alert(local('download_failed_title'), local('download_failed_desc'));
    } finally {
      setSaving(false);
    }
  };

  if (!uris.length) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>{local('close')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {uris.length > 1
              ? localF('contract_page_indicator', { current: index + 1, total: uris.length })
              : local('signed_contract_label')}
          </Text>
          <TouchableOpacity
            onPress={handleDownload}
            disabled={saving}
            hitSlop={12}
            style={[styles.headerBtn, styles.downloadBtn, saving && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.downloadBtnText}>{local('download_action')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onPagerEnd}
          style={styles.pager}
        >
          {uris.map((uri, i) => (
            <ScrollView
              key={`${uri}-${i}`}
              style={{ width: SCREEN_W, height: SCREEN_H - 120 }}
              contentContainerStyle={styles.zoomContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              bouncesZoom
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </ScrollView>
          ))}
        </ScrollView>

        <Text style={styles.hint}>{local('pinch_to_zoom_hint')}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)'
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12
  },
  headerBtn: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 8
  },
  headerBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16
  },
  downloadBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36
  },
  downloadBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14
  },
  pager: {
    flex: 1
  },
  zoomContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H * 0.72
  },
  hint: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    paddingBottom: 12,
    paddingHorizontal: 16
  }
});
