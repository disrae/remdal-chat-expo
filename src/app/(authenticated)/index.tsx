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
        <View className="flex-1 bg-slate-400">
            {/* Outer container that centers content */}
            <View className="flex-1 items-center">
                {/* Inner container with max width */}
                <View className="flex-1 w-full max-w-3xl">
                    {/* White header with notch area */}
                    <SafeAreaView className="bg-white pb-2 shadow-md rounded- z-10 lg:rounded-b-md" edges={['top']}>
                        <View className="w-full items-center justify-center lg:py-4">
                            <Text className="text-lg text-dark font-semibold">Messages</Text>
                        </View>
                    </SafeAreaView>

                    {/* Main content area */}
                    <View className="flex-1 bg-slate-200 border-black/50 border lg:-mt-1">
                        <View className="p-4">
                            <Pressable className="bg-primary px-4 py-2 rounded-md flex-row items-center gap-2 self-start" onPress={handleSignOut}>
                                <Text className="text-white">Sign Out</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
