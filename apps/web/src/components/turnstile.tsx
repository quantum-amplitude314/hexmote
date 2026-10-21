"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileOptions = {
  sitekey: string;
  appearance: "interaction-only";
  callback: (token: string) => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileProps = { siteKey: string; onToken: (token: string) => void; onError: () => void };

export function Turnstile({ siteKey, onToken, onError }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };
  const [scriptReady, setScriptReady] = useState(false);
  useEffect(() => {
    const { turnstile } = window;
    const element = container.current;
    if (!scriptReady || !turnstile || !element) return;
    const widgetId = turnstile.render(element, {
      sitekey: siteKey,
      appearance: "interaction-only",
      callback: (token) => callbacks.current.onToken(token),
      "error-callback": () => callbacks.current.onError(),
    });

    return () => turnstile.remove(widgetId);
  }, [scriptReady, siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setScriptReady(true)}
      />
      <div ref={container} />
    </>
  );
}
