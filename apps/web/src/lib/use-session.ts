import type { Painter } from "@hexmote/contracts";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "./api-client";

export type SessionState =
  | { status: "checking" }
  | { status: "challenge" }
  | { status: "ready"; you: Painter }
  | { status: "failed" };

const stateOf = (you: Painter | null) => {
  const state: SessionState = you ? { status: "ready", you } : { status: "challenge" };

  return state;
};

export const useSession = () => {
  const [session, setSession] = useState<SessionState>({ status: "checking" });
  useEffect(() => {
    apiClient.session
      .get()
      .then(({ you }) => setSession(stateOf(you)))
      .catch(() => setSession({ status: "failed" }));
  }, []);
  const startSession = useCallback(async (turnstileToken: string) => {
    try {
      const { you } = await apiClient.session.create({ turnstileToken });
      setSession(you ? { status: "ready", you } : { status: "failed" });
    } catch {
      setSession({ status: "failed" });
    }
  }, []);
  const fail = useCallback(() => setSession({ status: "failed" }), []);
  const sessionGate = { session, startSession, fail };

  return sessionGate;
};
