import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptic = (weight: 'Light' | 'Medium' | 'Heavy') => {
    if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle[weight]);
    }
};

export const colors = {
    primary: "#0052a3",
    secondary: "#009ddc",
    tertiary: "#fdc400",
    base: "#ddd",
    dark: "#333",
    light: "#eee"
};
