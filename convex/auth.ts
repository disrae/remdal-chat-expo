// import { Password } from "@convex-dev/auth/providers/Password";
import Password from "./CustomPassword";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    createOrUpdateUser: async (ctx, args) => {
      if (args.existingUserId) {
        // Optionally merge updated fields into the existing user object here
        return args.existingUserId;
      }

      const user = await ctx.db.query("users").filter(q => q.eq(q.field("email"), args.profile.email)).first();
      console.log(JSON.stringify({ user }, null, 2));
      if (user) return user._id;

      const userId = await ctx.db.insert("users", {
        name: args.profile.name as string,
        email: args.profile.email as string,
        privilege: "admin",
      });

      return userId;
    },
  },
});