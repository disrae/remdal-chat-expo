import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        category: v.union(
            v.literal("company-wide"),
            v.literal("department"),
            v.literal("project"),
            v.literal("private")
        ),
        department: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get the current user ID
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Create the chat
        const chatId = await ctx.db.insert("chats", {
            name: args.name,
            description: args.description || "This is the first chat ever.",
            createdBy: userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            category: args.category || "company-wide",
            // department: args.department || "",
            // image: args.image,
        });

        // Add creator as a member with admin role
        await ctx.db.insert("chatMembers", {
            chatId,
            userId,
            role: "admin",
            joinedAt: Date.now(),
            isMuted: false,
        });

        return chatId;
    },
});

export const list = query({
    args: {
        limit: v.optional(v.number()),
        cursor: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        // Default limit to 10 chats per page
        const limit = args.limit ?? 10;

        // Build the basic query
        let chatsQuery = ctx.db.query("chats")
            .withIndex("by_updated");

        // Apply cursor-based pagination if cursor is provided
        if (args.cursor) {
            const [updatedAt, chatId] = args.cursor.split(':');
            chatsQuery = chatsQuery.filter(q =>
                q.or(
                    q.lt(q.field("updatedAt"), parseInt(updatedAt)),
                    q.and(
                        q.eq(q.field("updatedAt"), parseInt(updatedAt)),
                        q.lt(q.field("_id"), chatId)
                    )
                )
            );
        }

        // Order by updatedAt (newest first) and limit results
        const chats = await chatsQuery
            .order("desc")
            .take(limit);

        // Generate the next cursor
        let nextCursor = null;
        if (chats.length === limit) {
            const lastChat = chats[chats.length - 1];
            nextCursor = `${lastChat.updatedAt}:${lastChat._id}`;
        }

        // Filter out null chats and add hasUnread field
        const chatsWithUnreadStatus = await Promise.all(
            chats
                .filter((chat): chat is NonNullable<typeof chat> => chat !== null)
                .map(async (chat) => {
                    // Get the most recent messages for this chat
                    const recentMessages = await ctx.db
                        .query("messages")
                        .withIndex("chatId", (q) => q.eq("chatId", chat._id))
                        .order("desc")
                        .take(5);

                    // Check if there are any unread messages
                    let hasUnread = false;

                    for (const message of recentMessages) {
                        // Check if this message has been read by the current user
                        const messageRead = await ctx.db
                            .query("messageReads")
                            .withIndex("messageId", (q) =>
                                q.eq("messageId", message._id))
                            .filter(q => q.eq(q.field("userId"), userId))
                            .unique();

                        // If no read record found for this message, mark chat as having unread messages
                        if (!messageRead) {
                            hasUnread = true;
                            break;
                        }
                    }

                    return { ...chat, hasUnread };
                })
        );

        // Return both the chats and pagination info
        return {
            chats: chatsWithUnreadStatus,
            nextCursor
        };
    },
});

export const get = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // FOR TESTING: Skip membership check
        // Return the chat without verifying membership
        const chat = await ctx.db.get(args.chatId);
        return chat;
    },
});

export const getMessages = query({
    args: { chatId: v.id("chats") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // FOR TESTING: Skip membership check
        // Get messages for this chat, sorted by timestamp
        const messages = await ctx.db
            .query("messages")
            .withIndex("chatId", (q) => q.eq("chatId", args.chatId))
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .order("desc")
            .collect();

        // Get user information for each message sender
        const messagesWithUsers = await Promise.all(
            messages.map(async (message) => {
                const sender = await ctx.db.get(message.senderId);
                return {
                    ...message,
                    sender: sender ? {
                        _id: sender._id,
                        name: sender.name,
                        email: sender.email,
                        image: sender.image
                    } : undefined
                };
            })
        );

        return messagesWithUsers;
    },
});

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db.get(userId);
        return user;
    },
});

export const sendMessage = mutation({
    args: {
        chatId: v.id("chats"),
        content: v.string(),
        parentMessageId: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // FOR TESTING: Skip membership check
        // Create the message without verifying membership
        const messageId = await ctx.db.insert("messages", {
            chatId: args.chatId,
            senderId: userId,
            content: args.content,
            timestamp: Date.now(),
            parentMessageId: args.parentMessageId,
        });

        // Update the chat's updatedAt timestamp
        await ctx.db.patch(args.chatId, {
            updatedAt: Date.now(),
        });

        return messageId;
    },
});

export const markMessageRead = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Check if this message is already marked as read
        const existingRead = await ctx.db
            .query("messageReads")
            .withIndex("messageId", (q) =>
                q.eq("messageId", args.messageId))
            .filter(q => q.eq(q.field("userId"), userId))
            .unique();

        // If not already read, mark it as read
        if (!existingRead) {
            await ctx.db.insert("messageReads", {
                messageId: args.messageId,
                userId,
                readAt: Date.now(),
            });
        }

        return true;
    },
});

export const markChatRead = mutation({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Get all unread messages for this chat
        const messages = await ctx.db
            .query("messages")
            .withIndex("chatId", (q) => q.eq("chatId", args.chatId))
            .collect();

        // Mark each message as read
        for (const message of messages) {
            const existingRead = await ctx.db
                .query("messageReads")
                .withIndex("messageId", (q) =>
                    q.eq("messageId", message._id))
                .filter(q => q.eq(q.field("userId"), userId))
                .unique();

            // If not already read, mark it as read
            if (!existingRead) {
                await ctx.db.insert("messageReads", {
                    messageId: message._id,
                    userId,
                    readAt: Date.now(),
                });
            }
        }

        return true;
    },
});
