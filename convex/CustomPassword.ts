import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel, Id } from "./_generated/dataModel";
import { z } from "zod";
import { ConvexError } from "convex/values";

const SignUpSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    flow: z.literal("signUp"),
});

const SignInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    flow: z.literal("signIn"),
});

const ParamsSchema = z.discriminatedUnion("flow", [SignUpSchema, SignInSchema]);

export default Password<DataModel>({
    profile(params) {
        const { error, data } = ParamsSchema.safeParse(params);
        if (error) { throw new ConvexError(error.format()); }

        return {
            email: data.email,
            // For sign-up use provided name, for sign-in use a placeholder since we'll get it from DB
            name: data.flow === "signUp" ? data.name : "existing_user",
            pushToken: (params as any).pushToken,
        };
    },
    // verify: ResendOTP
});
