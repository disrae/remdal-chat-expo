import { View, Text } from 'react-native';
import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuthToken } from "@convex-dev/auth/react";

export default function AuthenticatedLayout() {
    const token = useAuthToken();

    if (!token) {
        return <Redirect href="/" />;
    }

    return (
        <Slot />
    );
}
