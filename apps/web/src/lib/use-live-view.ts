import type { LiveMessage } from "@hexmote/contracts";
import { useEffect, useReducer } from "react";
import { applyLiveMessage, emptyLiveState, type LiveState } from "./live-view";

const sameOriginLiveUrl = () => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${location.host}/live`;
};

export const useLiveView = () => {
  const [state, dispatch] = useReducer(
    (current: LiveState, message: LiveMessage) => applyLiveMessage({ state: current, message }),
    emptyLiveState,
  );
  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_LIVE_URL ?? sameOriginLiveUrl());
    socket.addEventListener("message", ({ data }) => dispatch(JSON.parse(String(data))));

    return () => socket.close();
  }, []);

  return state;
};
