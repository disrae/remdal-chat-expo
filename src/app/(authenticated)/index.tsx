import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function Home() {
    const { signOut } = useAuthActions();

    const handleSignOut = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await signOut();
    };

    return (
        <View className="flex-1 items-center justify-center">
            <Pressable className='bg-primary px-4 py-2 rounded-md' onPress={handleSignOut}>
                <Text className='text-white'>Sign Out</Text>
            </Pressable>
        </View>
    );
}
