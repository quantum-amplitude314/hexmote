import type { AdminCanvasStatus } from "@hexmote/contracts";
import { useCallback, useEffect, useState } from "react";
import { fetchAdminStatus, runAdminCommand } from "./admin-client";
import { type AdminCommand, adminResultText, failedRequestText } from "./admin-text";

export const useAdmin = () => {
  const [canvas, setCanvas] = useState<AdminCanvasStatus | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const refresh = useCallback(async () => {
    const request = await fetchAdminStatus();
    if (request.status === "failed") setResultText(failedRequestText(request));
    else setCanvas(request.canvas);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const run = async (command: AdminCommand) => {
    setRunning(true);
    const outcome = await runAdminCommand(command);
    setResultText(adminResultText({ command, outcome }));
    await refresh();
    setRunning(false);
  };
  const admin = { canvas, resultText, running, run, refresh };

  return admin;
};
