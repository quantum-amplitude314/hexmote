import type { LiveMessage, PublicCanvasView } from "@hexmote/contracts";
import { useEffect, useReducer } from "react";
import { applyLiveMessage } from "./live-view";

const sameOriginLiveUrl = () => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${location.host}/live`;
};

export const useLiveView = () => {
  const [view, dispatch] = useReducer(
    (current: PublicCanvasView | null, message: LiveMessage) =>
      applyLiveMessage({ view: current, message }),
    null,
  );
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_LIVE_URL ?? sameOriginLiveUrl());
    socket.addEventListener("message", ({ data }) => dispatch(JSON.parse(String(data))));

    return () => socket.close();
  }, []);

  return view;
};
