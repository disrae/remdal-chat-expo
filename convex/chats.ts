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
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        // FOR TESTING: Get all chats instead of just the user's chats
        const chats = await ctx.db
            .query("chats")
            .collect();

        // Sort by most recently created
        return chats
            .filter((chat): chat is NonNullable<typeof chat> => chat !== null)
            .sort((a, b) => b.createdAt - a.createdAt);
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

        return messageId;
    },
});
