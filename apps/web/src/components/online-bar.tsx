import type { Painter } from "@hexmote/contracts";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

type OnlineBarProps = { you: Painter | null; online: Painter[] };

export function OnlineBar({ you, online }: OnlineBarProps) {
  return (
    <div className="grid justify-items-center gap-1 text-center">
      <p className="text-base font-medium">Realtime collaborative canvas</p>
      <p className="text-xs text-muted-foreground">
        {online.length} online now
        {online.map(({ name, color }) => {
          const isYou = name === you?.name;

          return (
            <Fragment key={name}>
              {" · "}
              <span className={cn("font-semibold", !isYou && "opacity-60")} style={{ color }}>
                {name}
              </span>
              {isYou && " (you)"}
            </Fragment>
          );
        })}
      </p>
    </div>
  );
}
