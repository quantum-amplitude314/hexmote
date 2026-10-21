import { useEffect, useState } from "react";

/** Ticks until `until`, then stops; `null` or a past time does not tick. */
export const useNow = ({ until, tickMs }: { until: number | null; tickMs: number }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const started = Date.now();
    setNow(started);
    if (until === null || until <= started) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(timer);
    }, tickMs);

    return () => clearInterval(timer);
  }, [until, tickMs]);

  return now;
};
