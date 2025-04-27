import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';

export default function Home() {
    const { signOut } = useAuthActions();
    return (
        <View className="flex-1 items-center justify-center">
            <Text>Home</Text>
            <Pressable onPress={() => signOut()}>
                <Text>Sign Out</Text>
            </Pressable>
        </View>
    );
}
