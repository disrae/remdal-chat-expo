import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { query } from "./_generated/server";
import { getAuthUserId, } from '@convex-dev/auth/server';

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        return userId !== null ? ctx.db.get(userId) : null;
    },
});
