import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';

import BackNavigation from '@/components/BackNavigation';
import { colors, fonts } from '@/theme';

export default function ModalScreen() {
  return (
    <BackNavigation>
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      </View>
    </BackNavigation>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
  },
});