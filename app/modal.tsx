import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Typography } from '@/components/atoms/Typography';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <Typography variant="h1" weight="bold">This is a modal</Typography>
      <Link href="/" dismissTo style={styles.link}>
        <Typography style={{ color: '#0a7ea4' }}>Go to home screen</Typography>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
