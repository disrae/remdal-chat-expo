import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, haptic } from '@/style';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc } from '../../../convex/_generated/dataModel';

export default function Home() {
    const { signOut } = useAuthActions();
    const [modalVisible, setModalVisible] = useState(false);
    const [chatName, setChatName] = useState('');
    const [description, setDescription] = useState('');

    // Convex mutations and queries
    const createChat = useMutation(api.chats.create);
    const chats = useQuery(api.chats.list) || [];

    const handleSignOut = async () => {
        haptic('Light');
        await signOut();
    };

    const handleAddPress = () => {
        haptic('Light');
        setModalVisible(true);
    };

    const handleChatPress = (chatId: string) => {
        haptic('Light');
        router.push(`/${chatId}`);
    };

    const handleCreateChat = async () => {
        if (chatName.trim()) {
            haptic('Light');
            try {
                const chatId = await createChat({
                    name: chatName.trim(),
                    description: description.trim() || undefined,
                    category: "private"
                });
                console.log('Chat created with ID:', chatId);
                // Navigate to the newly created chat
                router.push(`/${chatId}`);
            } catch (error) {
                console.error('Failed to create chat:', error);
            }
            setModalVisible(false);
            setChatName('');
            setDescription('');
        }
    };

    const handleCancel = () => {
        setModalVisible(false);
        setChatName('');
        setDescription('');
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
                            {/* List chats */}
                            {chats.length === 0 ? (
                                <Text className="text-center text-gray-500 my-4">No chats yet. Create one!</Text>
                            ) : (
                                chats.map((chat: Doc<"chats">) => (
                                    <Pressable
                                        key={chat._id}
                                        className="bg-white rounded-lg p-4 mb-2 shadow-sm"
                                        onPress={() => handleChatPress(chat._id)}
                                    >
                                        <Text className="font-medium text-lg">{chat.name}</Text>
                                        {chat.description && (
                                            <Text className="text-gray-600 mt-1">{chat.description}</Text>
                                        )}
                                    </Pressable>
                                ))
                            )}
                        </View>

                        {/* Plus Button (FAB) */}
                        <Pressable
                            onPress={handleAddPress}
                            className="absolute bottom-10 right-8 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
                        >
                            <Ionicons name="add" size={30} color="white" />
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* New Chat Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancel}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white w-[85%] max-w-md rounded-lg p-6 shadow-xl">
                        <Text className="text-xl font-semibold text-center mb-4">New Chat</Text>

                        <Text className="text-sm font-medium mb-1">Chat Name</Text>
                        <TextInput
                            className="border border-gray-300 rounded-md px-4 py-2 mb-3"
                            value={chatName}
                            onChangeText={setChatName}
                            placeholder="Enter chat name"
                            autoFocus
                        />

                        <Text className="text-sm font-medium mb-1">Description (optional)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-md px-4 py-2 mb-5"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter description"
                            multiline
                        />

                        <View className="flex-row justify-end mt-2 space-x-3">
                            <Pressable
                                onPress={handleCancel}
                                className="px-4 py-2 rounded-md"
                            >
                                <Text className="text-gray-600 font-medium">Cancel</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleCreateChat}
                                className="bg-primary px-4 py-2 rounded-md"
                                disabled={!chatName.trim()}
                            >
                                <Text className="text-white font-medium">Create</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
