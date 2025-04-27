import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
    const { signOut } = useAuthActions();

    const handleSignOut = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await signOut();
    };

    return (
        <View className="flex-1 bg-primary">

            <View className="flex-1">

                {/* White header with notch area */}
                <SafeAreaView className="bg-primary pb-2 shadow-md rounded- z-10" edges={['top']}>
                    <View className="w-full items-center justify-center">
                        <Text className="text-lg text-light font-semibold">Messages</Text>
                    </View>
                </SafeAreaView>

                {/* Main content area */}
                <View className="flex-1 bg-gray-100">
                    <View className="p-4">
                        <Pressable className="bg-primary px-4 py-2 rounded-md" onPress={handleSignOut}>
                            <Text className="text-white">Sign Out</Text>
                        </Pressable>
                    </View>
                </View>

            </View>

        </View>
    );
}
