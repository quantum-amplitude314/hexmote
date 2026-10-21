import type { Painter } from "@hexmote/contracts";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

type OnlineBarProps = { you: Painter | null; online: Painter[]; connected: boolean };

export function OnlineBar({ you, online, connected }: OnlineBarProps) {
  return (
    <div className="grid justify-items-center gap-1 text-center">
      <p className="text-base font-medium">Realtime collaborative canvas</p>
      <p className="text-xs text-muted-foreground">
        {connected ? `${online.length} online now` : "Reconnecting…"}
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
