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
    }).index("email", ["email"]),
});

export default schema;