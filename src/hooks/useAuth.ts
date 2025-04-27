import { View, Text } from 'react-native';
import React from 'react';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';

export function useAuth() {
    const user = useQuery(api.users.currentUser);

    return {};
}

export default useAuth;