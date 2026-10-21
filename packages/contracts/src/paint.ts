import type { Rejection } from "@hexmote/domain";
import { oc } from "@orpc/contract";
import { z } from "zod";

const cellSchema = z.object({ axialQ: z.int(), axialR: z.int() });
export const hexCodeColorSchema = z.string().regex(/^#[0-9a-f]{6}$/);

export const paintCellInputSchema = z.object({ cell: cellSchema, color: hexCodeColorSchema });

const rejectionSchema = z.discriminatedUnion("reason", [
  z.object({ reason: z.literal("canvasExists") }),
  z.object({ reason: z.literal("templateColorNotInPalette") }),
  z.object({ reason: z.literal("noCanvas") }),
  z.object({ reason: z.literal("cellOutsideCanvas") }),
  z.object({ reason: z.literal("colorNotInPalette") }),
  z.object({ reason: z.literal("cooldown"), retryAt: z.number() }),
  z.object({ reason: z.literal("canvasFrozen") }),
  z.object({ reason: z.literal("canvasCompleted") }),
]) satisfies z.ZodType<Rejection>;

export const paintResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("painted"), nextPaintAt: z.number() }),
  z.object({ status: z.literal("rejected"), rejection: rejectionSchema }),
]);

export type PaintResult = z.infer<typeof paintResultSchema>;

export const paintCellContract = oc
  .route({ method: "POST", path: "/paint", summary: "Paint one cell" })
  .input(paintCellInputSchema)
  .output(paintResultSchema);
