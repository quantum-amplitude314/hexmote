import type { CreateCanvas } from "@hexmote/domain";
import type { Canvas } from "./canvas.ts";
import { notImplemented } from "./not-implemented.ts";

type HandleAdminRequest = (input: {
  request: Request;
  canvas: DurableObjectStub<Canvas>;
  emote: Pick<CreateCanvas, "palette" | "template">;
}) => Promise<Response>;

export const handleAdminRequest: HandleAdminRequest = () => notImplemented();
