import { View, Text } from 'react-native';
import React from 'react';
import { Redirect, Slot, Stack, useRouter } from 'expo-router';
import { useAuthToken } from "@convex-dev/auth/react";
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';

export default function AuthenticatedLayout() {
    const token = useAuthToken();
    const router = useRouter();
    const user = useQuery(api.users.currentUser);

    if (!user) {
        return <Redirect href="/login" />;
    }

    return (
        <Stack screenOptions={{
            headerShown: false,
        }} />
    );
}
