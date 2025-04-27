import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, haptic } from '@/style';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import { ConvexError } from 'convex/values';

// Define a type for the message with sender information
type MessageWithSender = Doc<"messages"> & {
    sender?: {
        _id: Id<"users">;
        name: string;
        email: string;
        image?: string;
    };
};

export default function ChatScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string; }>();
    const [message, setMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // Ensure we have a chat ID
    if (!chatId) {
        router.back();
        return null;
    }

    try {
        // Convert the string ID to a proper Convex ID
        // We need to force this type because we're sure it's a valid chat ID
        const chatIdObj = chatId as unknown as Id<"chats">;

        // Convex queries and mutations
        const currentUser = useQuery(api.chats.getCurrentUser);
        const chat = useQuery(api.chats.get, { chatId: chatIdObj });
        const messages = useQuery(api.chats.getMessages, { chatId: chatIdObj }) || [];
        const sendMessage = useMutation(api.chats.sendMessage);

        const handleSend = async () => {
            if (!message.trim()) return;

            haptic('Light');
            try {
                await sendMessage({
                    chatId: chatIdObj,
                    content: message.trim(),
                });
                setMessage('');
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        };

        // Scroll to bottom when new messages arrive
        useEffect(() => {
            if (messages.length > 0 && flatListRef.current) {
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        }, [messages.length]);

        // Format timestamp
        const formatTime = (timestamp: number) => {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        if (!chat || !currentUser) {
            return (
                <View className="flex-1 justify-center items-center bg-slate-200">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }

        const MessageItem = ({ item }: { item: MessageWithSender; }) => {
            const isOwnMessage = currentUser && item.senderId === currentUser._id;

            return (
                <View className={`my-2 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    {/* Sender name (only for messages from others) */}
                    {!isOwnMessage && item.sender && (
                        <Text className="text-xs text-gray-500 ml-2 mb-1">
                            {item.sender.name}
                        </Text>
                    )}

                    <View className="flex-row">
                        <View
                            className={`rounded-lg px-3 py-2 max-w-[80%] ${isOwnMessage
                                    ? 'bg-primary rounded-tr-none'
                                    : 'bg-gray-200 rounded-tl-none'
                                }`}
                        >
                            <Text className={isOwnMessage ? 'text-white' : 'text-black'}>
                                {item.content}
                            </Text>
                            <Text className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-black/50'}`}>
                                {formatTime(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        };

        return (
            <View className="flex-1 bg-slate-100">
                <SafeAreaView className="flex-1" edges={['top']}>
                    {/* Header */}
                    <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
                        <Pressable
                            className="mr-3 p-1"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.dark} />
                        </Pressable>
                        <View>
                            <Text className="font-semibold text-lg">{chat.name}</Text>
                            {chat.description && (
                                <Text className="text-gray-500 text-sm">{chat.description}</Text>
                            )}
                        </View>
                    </View>

                    {/* Messages */}
                    <FlatList
                        ref={flatListRef}
                        data={messages.sort((a, b) => a.timestamp - b.timestamp)}
                        keyExtractor={(item) => item._id.toString()}
                        renderItem={({ item }) => <MessageItem item={item as MessageWithSender} />}
                        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                        inverted={false}
                    />

                    {/* Message Input */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={90}
                    >
                        <View className="p-2 border-t border-gray-200 bg-white flex-row items-center">
                            <TextInput
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 bg-white"
                                placeholder="Type a message..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                style={{ maxHeight: 100 }}
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={!message.trim()}
                                className={`rounded-full p-2 ${message.trim() ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <Ionicons name="send" size={20} color="white" />
                            </Pressable>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        );
    } catch (error) {
        // Handle any errors from invalid chat IDs
        console.error('Error in chat screen:', error);
        router.back();
        return null;
    }
}
