import { oc } from "@orpc/contract";
import { z } from "zod";
import type { Painter } from "./live.ts";
import { hexCodeColorSchema } from "./paint.ts";

const painterSchema = z.object({
  name: z.string(),
  color: hexCodeColorSchema,
}) satisfies z.ZodType<Painter>;

const sessionSchema = z.object({ you: painterSchema.nullable() });

export type Session = z.infer<typeof sessionSchema>;

export const sessionContract = {
  get: oc
    .route({ method: "GET", path: "/session", summary: "Who you are; nobody without a session" })
    .output(sessionSchema),
  create: oc
    .route({ method: "POST", path: "/session", summary: "Start a session after Turnstile" })
    .input(z.object({ turnstileToken: z.string().min(1) }))
    .output(sessionSchema),
};
