import { useEffect, useReducer } from "react";
import { openLiveConnection } from "./live-connection";
import { applyLiveUpdate, emptyLiveState, type LiveState, type LiveUpdate } from "./live-view";

const sameOriginLiveUrl = () => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${location.host}/live`;
};

export const useLiveView = ({ onRefused }: { onRefused: () => void }) => {
  const [state, dispatch] = useReducer(
    (current: LiveState, update: LiveUpdate) => applyLiveUpdate({ state: current, update }),
    emptyLiveState,
  );
  useEffect(() => {
    const connection = openLiveConnection({
      url: process.env.NEXT_PUBLIC_LIVE_URL ?? sameOriginLiveUrl(),
      onMessage: dispatch,
      onDisconnect: () => dispatch({ type: "disconnected" }),
      onRefused,
    });

    return () => connection.close();
  }, [onRefused]);

  return state;
};
