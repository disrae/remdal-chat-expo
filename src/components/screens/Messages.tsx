import { View, Text, Pressable, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useAuthActions } from '@convex-dev/auth/dist/react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, haptic } from '@/style';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';

// Interface for the chat with the hasUnread field
interface ChatWithReadStatus extends Doc<"chats"> {
    hasUnread?: boolean;
}

// Define the response type from the paginated list query
interface ChatsResponse {
    chats: ChatWithReadStatus[];
    nextCursor: string | null;
}

export function MessagesScreen() {
    const { signOut } = useAuthActions();
    const [modalVisible, setModalVisible] = useState(false);
    const [chatName, setChatName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [allChats, setAllChats] = useState<ChatWithReadStatus[]>([]);
    const CHATS_PER_PAGE = 10;

    // Convex mutations and queries
    const createChat = useMutation(api.chats.create);
    const chatsResponse = useQuery(api.chats.list, {
        limit: CHATS_PER_PAGE,
        cursor
    });

    // Use a default empty response if the query hasn't loaded yet
    const chatsData: ChatsResponse = chatsResponse ? (chatsResponse as ChatsResponse) : { chats: [], nextCursor: null };
    const markChatRead = useMutation(api.chats.markChatRead);

    // Update allChats when new data arrives
    React.useEffect(() => {
        if (chatsData && chatsData.chats) {
            if (cursor) {
                // Append new chats to existing ones
                setAllChats(prev => [...prev, ...chatsData.chats]);
            } else {
                // Initial load or refresh
                setAllChats(chatsData.chats);
            }
            setIsLoadingMore(false);
        }
    }, [chatsData, cursor]);

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

        // Mark chat as read when opening it
        markChatRead({ chatId: chatId as any })
            .catch(error => console.error('Failed to mark chat as read:', error));

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

    // Handle load more chats
    const handleLoadMore = useCallback(() => {
        if (isLoadingMore || !chatsData.nextCursor) return;

        setIsLoadingMore(true);
        setCursor(chatsData.nextCursor);
    }, [isLoadingMore, chatsData.nextCursor]);

    // Empty list component
    const renderEmptyList = () => (
        <View className="flex-1 justify-center items-center py-8">
            <Text className="text-center text-gray-500">No chats yet. Create one!</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-300">
            {/* Outer container that centers content */}
            <View className="flex-1 items-center">
                {/* Inner container with max width */}
                <View className="flex-1 w-full max-w-3xl">
                    {/* White header with notch area */}
                    <SafeAreaView className="bg-white pb-2 border-b-2 border-gray-200 rounded- z-10 lg:rounded-b-md" edges={['top']}>
                        <View className="w-full flex-row items-center justify-between px-4 lg:py-4">
                            <Text className="text-2xl text-dark font-semibold">Chats</Text>
                            <Pressable
                                onPress={handleSignOut}
                                className="p-2"
                            >
                                <Ionicons name="log-out-outline" size={24} color={colors.dark} />
                            </Pressable>
                        </View>
                    </SafeAreaView>

                    {/* Main content area */}
                    <View className="flex-1 bg-slate-100 shadow lg:-mt-1">
                        {/* FlatList for chats */}
                        <FlatList
                            data={allChats}
                            keyExtractor={(item) => item._id.toString()}
                            contentContainerStyle={{ flexGrow: 1 }}
                            ListEmptyComponent={renderEmptyList}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            initialNumToRender={10}
                            maxToRenderPerBatch={5}
                            windowSize={5}
                            removeClippedSubviews={true}
                            ListFooterComponent={
                                isLoadingMore ? (
                                    <View className="py-4">
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                ) : null
                            }
                            renderItem={({ item }) => {
                                const unread = item.hasUnread;
                                return (
                                    <Pressable
                                        className={`p-2.5 ${unread ? 'bg-white border-b border-gray-200' : 'bg-gray-50 border-b border-gray-200'}`}
                                        onPress={() => handleChatPress(item._id)}
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <View>
                                                <Text className={`font-medium text-lg ${unread ? 'font-bold text-black' : 'text-gray-800'}`}>
                                                    {item.name}
                                                </Text>
                                                {item.description && (
                                                    <Text className={`mt-1 ${unread ? 'text-gray-700' : 'text-gray-600'}`}>
                                                        {item.description}
                                                    </Text>
                                                )}
                                            </View>
                                            {unread && (
                                                <View className="w-3 h-3 bg-blue-500 rounded-full" />
                                            )}
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />

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
