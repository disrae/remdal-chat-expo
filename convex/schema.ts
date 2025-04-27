import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
    ...authTables,
    users: defineTable({
        name: v.string(),
        email: v.string(),
        privilege: v.optional(v.union(v.literal("admin"), v.literal("user"))),
        pushToken: v.optional(v.string()),
        image: v.optional(v.string()),
        phone: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phoneVerificationTime: v.optional(v.number()),
        // User status for construction teams
        status: v.optional(v.union(
            v.literal("available"),
            v.literal("on-site"),
            v.literal("in-meeting"),
            v.literal("offline")
        )),
        lastActive: v.optional(v.number()),
        currentLocation: v.optional(v.string()),
    }).index("email", ["email"]),

    // Chats table to store chat rooms
    chats: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        image: v.optional(v.string()),

        // TODO: Do we need this?
        // Category to determine if new users should automatically get access
        category: v.union(
            v.literal("company-wide"),
            v.literal("department"),
            v.literal("project"),
            v.literal("private")
        ),
        department: v.optional(v.string()),
    }).index("createdBy", ["createdBy"]).index("by_updated", ["updatedAt"]),

    // Chat members table to track who has access to which chats
    chatMembers: defineTable({
        chatId: v.id("chats"),
        userId: v.id("users"),
        role: v.union(v.literal("admin"), v.literal("member")),
        joinedAt: v.number(),
        // Track if user has muted notifications for this chat
        isMuted: v.optional(v.boolean()),
    })
        .index("chatId", ["chatId"])
        .index("userId", ["userId"]),

    // Messages table for chat content
    messages: defineTable({
        chatId: v.id("chats"),
        senderId: v.id("users"),
        content: v.string(),
        timestamp: v.number(),
        // Support for threaded messages
        parentMessageId: v.optional(v.id("messages")),
        // Message editing and deletion tracking
        editedAt: v.optional(v.number()),
        deletedAt: v.optional(v.number()),
        // Message pinning
        isPinned: v.optional(v.boolean()),
        pinnedBy: v.optional(v.id("users")),
        pinnedAt: v.optional(v.number()),
    })
        .index("chatId", ["chatId"])
        .index("senderId", ["senderId"])
        .index("parentMessageId", ["parentMessageId"]),

    // Track message reads for important updates
    messageReads: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        readAt: v.number(),
    })
        .index("messageId", ["messageId"])
        .index("userId", ["userId"]),

    // Track message reactions
    messageReactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        reaction: v.string(), // Could be emoji or custom reactions like "On it", "Got it"
        timestamp: v.number(),
    })
        .index("messageId", ["messageId"])
        .index("userId", ["userId"]),

    // Track message edit history
    messageEdits: defineTable({
        messageId: v.id("messages"),
        editedBy: v.id("users"),
        oldContent: v.string(),
        editedAt: v.number(),
    })
        .index("messageId", ["messageId"]),

    // Unified file uploads table that can be linked to messages or other entities
    fileUploads: defineTable({
        fileName: v.string(),
        fileType: v.string(),
        fileUrl: v.string(),
        uploadedBy: v.id("users"),
        uploadedAt: v.number(),
        // Optional references to what this file is attached to
        messageId: v.optional(v.id("messages")),
        chatId: v.optional(v.id("chats")),
        // Type field to indicate what kind of attachment this is
        attachmentType: v.optional(v.union(
            v.literal("message"),
            v.literal("chat"),
            v.literal("profile")
        )),
    })
        .index("uploadedBy", ["uploadedBy"])
        .index("messageId", ["messageId"])
        .index("chatId", ["chatId"]),
});

export default schema;