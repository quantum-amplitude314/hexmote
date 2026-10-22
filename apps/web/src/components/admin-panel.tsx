"use client";

import { adminBudgetText, adminStatusText } from "@/lib/admin-text";
import { useAdmin } from "@/lib/use-admin";
import { useNow } from "@/lib/use-now";
import { ConfirmButton } from "./confirm-button";
import { Button } from "./ui/button";

export function AdminPanel() {
  const { canvas, resultText, running, run, refresh } = useAdmin();
  const now = useNow({ until: canvas?.resetAt ?? null, tickMs: 1000 });
  const statusText = canvas ? adminStatusText({ status: canvas, now }) : "Loading…";

  return (
    <section className="grid w-full max-w-md gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-1">
          <p aria-live="polite">{statusText}</p>
          {canvas && (
            <p className="text-sm text-muted-foreground">{adminBudgetText(canvas.budget)}</p>
          )}
        </div>
        <Button variant="outline" size="sm" disabled={running} onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={running} onClick={() => void run("create")}>
          Create
        </Button>
        <Button variant="secondary" disabled={running} onClick={() => void run("freeze")}>
          Freeze
        </Button>
        <Button variant="secondary" disabled={running} onClick={() => void run("unfreeze")}>
          Unfreeze
        </Button>
        <ConfirmButton
          label="Reset"
          title="Start a new round?"
          description="Every painted cell is cleared, and the 😀 starts again."
          disabled={running}
          onConfirm={() => void run("reset")}
        />
        <ConfirmButton
          label="Delete"
          title="Delete the canvas?"
          description="The canvas and all its events are deleted. Create starts a new one."
          variant="destructive"
          disabled={running}
          onConfirm={() => void run("delete")}
        />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {resultText}
      </p>
    </section>
  );
}
