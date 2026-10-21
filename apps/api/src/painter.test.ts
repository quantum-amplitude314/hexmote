import { describe, expect, test } from "vitest";
import { painterOf } from "./painter.ts";

const sessionId = "5f0c2a8e-3d1b-4c7a-9e2f-1b6d8c4a7e90";

describe("painterOf", () => {
  test("gives a session the same painter every time", () => {
    expect(painterOf(sessionId)).toEqual(painterOf(sessionId));
  });

  test("names a painter after a colour and an animal, with that colour", () => {
    const { name, color } = painterOf(sessionId);

    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  test("never picks a colour too light to read as text on the page", () => {
    const colors = Array.from({ length: 500 }, () => painterOf(crypto.randomUUID()).color);

    expect(colors).not.toContain("#ffffff");
    expect(colors).not.toContain("#e4e4e4");
  });
});
