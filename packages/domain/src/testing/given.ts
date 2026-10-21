import {
  type CanvasCommand,
  type CanvasEvent,
  type Decision,
  decide,
  type Rejection,
  replay,
  replayCanvasView,
} from "../index.ts";
import { cooldownMs } from "./fixtures.ts";

export const given = (events: CanvasEvent[]) => {
  const scenario = {
    when: (command: CanvasCommand) => decide({ state: replay(events), command, cooldownMs }),
    view: () => replayCanvasView(events),
  };

  return scenario;
};

export const accepted = (events: CanvasEvent[]) => {
  const decision: Decision = { status: "accepted", events };

  return decision;
};

export const rejected = (rejection: Rejection) => {
  const decision: Decision = { status: "rejected", rejection };

  return decision;
};
