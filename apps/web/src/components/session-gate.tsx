"use client";

import { createContext, type ReactNode } from "react";
import { useSession } from "@/lib/use-session";
import { Turnstile } from "./turnstile";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const RecheckSession = createContext<() => void>(() => undefined);

export function SessionGate({ children }: { children: ReactNode }) {
  const { session, startSession, fail, recheck } = useSession();
  if (session.status === "ready")
    return <RecheckSession value={recheck}>{children}</RecheckSession>;

  return (
    <section className="grid justify-items-center gap-3" aria-live="polite">
      {session.status === "checking" && <p>Connecting…</p>}
      {session.status === "challenge" && (
        <>
          <p>Checking that you are human…</p>
          <Turnstile siteKey={siteKey} onToken={startSession} onError={fail} />
        </>
      )}
      {session.status === "failed" && (
        <p>Could not check that you are human. Reload to try again.</p>
      )}
    </section>
  );
}
