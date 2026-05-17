import { StyleSheet, View } from 'react-native';
import CameraCapture from '../../components/CameraCapture';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CameraCapture />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lo cambiamos para que coincida con el nuevo diseño
  },
});