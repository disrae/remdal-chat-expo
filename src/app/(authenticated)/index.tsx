import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/style';

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
                        <View className="w-full flex-row items-center justify-between px-4 lg:py-4">
                            <Text className="text-lg text-dark font-semibold">Messages</Text>
                            <Pressable
                                onPress={handleSignOut}
                                className="p-2"
                            >
                                <Ionicons name="log-out-outline" size={24} color={colors.dark} />
                            </Pressable>
                        </View>
                    </SafeAreaView>

                    {/* Main content area */}
                    <View className="flex-1 bg-slate-200 border-black/50 border lg:-mt-1">
                        <View className="p-4">
                            {/* Content goes here */}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}
