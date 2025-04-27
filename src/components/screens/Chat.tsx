import { View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, haptic } from '@/style';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';
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

export function ChatScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string; }>();
    const router = useRouter();
    const [message, setMessage] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    if (!chatId) {
        router.replace('/');
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
        const markMessageRead = useMutation(api.chats.markMessageRead);
        const markChatRead = useMutation(api.chats.markChatRead);
        const deleteChat = useMutation(api.chats.deleteChat);

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

        // Handle chat deletion with confirmation
        const handleDelete = () => {
            haptic('Light');
            setDeleteModalVisible(true);
        };

        const confirmDelete = async () => {
            try {
                haptic('Medium');
                await deleteChat({ chatId: chatIdObj });
                // Navigate back after successful deletion
                router.back();
            } catch (error) {
                console.error('Failed to delete chat:', error);
                // Show error message
                Alert.alert(
                    "Error",
                    error instanceof Error ? error.message : "Failed to delete chat. Try again later."
                );
            }
        };

        const cancelDelete = () => {
            setDeleteModalVisible(false);
        };

        // Mark all messages as read when chat is opened
        useEffect(() => {
            if (chatIdObj && messages.length > 0) {
                // Mark entire chat as read
                markChatRead({ chatId: chatIdObj })
                    .catch(error => console.error('Failed to mark chat as read:', error));
            }
        }, [chatIdObj, messages.length]);

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



        const MessageItem = ({ item }: { item: MessageWithSender; }) => {
            const isOwnMessage = currentUser && item.senderId === currentUser._id;

            // Mark message as read when it renders (if not your own message)
            useEffect(() => {
                if (!isOwnMessage) {
                    markMessageRead({ messageId: item._id })
                        .catch(error => console.error('Failed to mark message as read:', error));
                }
            }, [item._id, isOwnMessage]);

            // Create a different component structure based on platform
            if (Platform.OS === 'web') {
                return (
                    <View style={{
                        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                        marginVertical: 8
                    }}>
                        {/* Sender name (only for messages from others) */}
                        {!isOwnMessage && item.sender && (
                            <Text style={{
                                fontSize: 12,
                                color: '#6b7280',
                                marginLeft: 8,
                                marginBottom: 4
                            }}>
                                {item.sender.name}
                            </Text>
                        )}

                        <View style={{
                            maxWidth: '80%',
                            backgroundColor: isOwnMessage ? colors.primary : '#e5e7eb',
                            borderRadius: 12,
                            padding: 8,
                            paddingHorizontal: 12,
                            borderTopRightRadius: isOwnMessage ? 0 : 12,
                            borderTopLeftRadius: isOwnMessage ? 12 : 0,
                        }}>
                            <div style={{
                                display: 'block',
                                width: '100%',
                                wordWrap: 'break-word',
                                color: isOwnMessage ? 'white' : 'black'
                            }}>
                                {item.content}
                            </div>
                            <Text style={{
                                fontSize: 12,
                                marginTop: 4,
                                color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                            }}>
                                {formatTime(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                );
            }

            // Native platforms use the original structure
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

        if (chat === null) {
            router.replace('/');
        }
        if (!chat || !currentUser) {
            return (
                <View className="flex-1 justify-center items-center bg-slate-200">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }
        return (
            <View className="flex-1 bg-slate-100">
                <SafeAreaView className="flex-1 bg-white" edges={['top']}>
                    {/* Header */}
                    <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-200">
                        <Pressable
                            className="mr-3 p-1"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.dark} />
                        </Pressable>
                        <View className="flex-1">
                            <Text className="font-semibold text-lg">{chat.name}</Text>
                            {chat.description && (
                                <Text className="text-gray-500 text-sm">{chat.description}</Text>
                            )}
                        </View>
                        <Pressable
                            className="p-2"
                            onPress={handleDelete}
                            hitSlop={8}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.dark} />
                        </Pressable>
                    </View>

                    {/* Main content with keyboard avoiding */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
                    >
                        {/* Messages */}
                        <FlatList
                            ref={flatListRef}
                            data={messages.sort((a, b) => a.timestamp - b.timestamp)}
                            keyExtractor={(item) => item._id.toString()}
                            renderItem={({ item }) => <MessageItem item={item as MessageWithSender} />}
                            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                            inverted={false}
                            style={{ flex: 1 }}
                            className="bg-slate-100"
                        />

                        {/* Message Input */}
                        <SafeAreaView edges={['bottom']} className="bg-white">
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
                        </SafeAreaView>
                    </KeyboardAvoidingView>
                </SafeAreaView>

                {/* Delete Chat Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={deleteModalVisible}
                    onRequestClose={cancelDelete}
                >
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <View className="bg-white w-[85%] max-w-md rounded-lg p-6 shadow-xl">
                            <Text className="text-xl font-semibold text-center mb-4">Delete Chat</Text>

                            <Text className="mb-4">
                                Are you sure you want to delete this chat? This action cannot be undone.
                            </Text>

                            <View className="flex-row justify-end mt-2 space-x-3">
                                <Pressable
                                    onPress={cancelDelete}
                                    className="px-4 py-2 rounded-md"
                                >
                                    <Text className="text-gray-600 font-medium">Cancel</Text>
                                </Pressable>

                                <Pressable
                                    onPress={confirmDelete}
                                    className="bg-primary px-4 py-2 rounded-md"
                                >
                                    <Text className="text-white font-medium">Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    } catch (error) {
        // Handle any errors from invalid chat IDs
        console.error('Error in chat screen:', error);
        router.back();
        return null;
    }
}
