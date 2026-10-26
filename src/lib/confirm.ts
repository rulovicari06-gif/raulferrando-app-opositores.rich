import { Alert, Platform } from 'react-native';

/** Pide confirmación antes de una acción destructiva. Funciona también en el navegador. */
export function confirm(title: string, message: string, onConfirm: () => void, actionLabel = 'Borrar') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
