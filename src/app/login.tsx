import React from 'react';
import { LoginScreen } from '../components/screens/Login';
import { useAuthToken } from "@convex-dev/auth/react";
import { Redirect } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';

export default function Unauthenticated() {
  const user = useQuery(api.users.currentUser);

  if (user) {
    return <Redirect href="/(authenticated)" />;
  }
  return <LoginScreen />;
}
