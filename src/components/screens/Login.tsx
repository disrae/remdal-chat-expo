import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { Button, TextInput, View, Text, Pressable, Image } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthToken } from "@convex-dev/auth/react";
import { Redirect } from 'expo-router';

export function LoginScreen() {
    const token = useAuthToken();
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signUp" | "signIn">("signIn");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    if (token) {
        return <Redirect href="/(authenticated)" />;
    }

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 px-6">
            <Animated.View
                entering={FadeIn.duration(500)}
                // className="w-full bg-white rounded-2xl shadow-lg p-6"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderRadius: 24,
                    backgroundColor: 'white',
                    padding: 24,
                    width: '100%',
                    maxWidth: 400,
                }}
            >
                <View className="items-center mb-6">
                    <Image
                        source={require("../../assets/images/icon.png")}
                        className="w-20 h-20 mb-2"
                        resizeMode="contain"
                    />
                    <Text className="text-gray-600 text-sm font-medium">
                        {step === "signIn" ? "Welcome back to your workspace" : "Join your team on Remdal Chat"}
                    </Text>
                </View>

                <View className="gap-2">
                    {step === "signUp" && (
                        <View>
                            <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
                            <TextInput
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary"
                                placeholder="Enter your name"
                                onChangeText={setName}
                                value={name}
                                autoCapitalize="words"
                            />
                        </View>
                    )}

                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                        <TextInput
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary"
                            placeholder="Enter your email"
                            onChangeText={setEmail}
                            value={email}
                            inputMode="email"
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                        />
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                        <View className="relative">
                            <TextInput
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary"
                                placeholder="Enter your password"
                                onChangeText={setPassword}
                                value={password}
                                secureTextEntry={!showPassword}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-0 bottom-0 justify-center"
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={24}
                                    color={showPassword ? "gray" : "black"}
                                />
                            </Pressable>
                        </View>
                    </View>

                </View>

                <View className="h-6" />

                <Pressable
                    className="w-full bg-primary py-3 rounded-lg active:opacity-90 mb-4"
                    onPress={() => {
                        void signIn("password", {
                            email,
                            password,
                            flow: step,
                            ...(step === "signUp" ? { name } : {})
                        });
                    }}
                >
                    <Text className="text-white font-semibold text-center">
                        {step === "signIn" ? "Sign In" : "Sign Up"}
                    </Text>
                </Pressable>

                <View className="flex-row justify-center items-center">
                    <Text className="text-gray-600">
                        {step === "signIn" ? "Don't have an account? " : "Already have an account? "}
                    </Text>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setStep(step === "signIn" ? "signUp" : "signIn");
                        }}
                    >
                        <Text className="text-secondary font-medium">
                            {step === "signIn" ? "Sign Up" : "Sign In"}
                        </Text>
                    </Pressable>
                </View>

            </Animated.View>
        </View>
    );
}