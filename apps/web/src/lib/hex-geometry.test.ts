import { describe, expect, test } from "bun:test";
import { gridBounds, hexCenter, hexCorners, type Point } from "./hex-geometry";

const radius = 10;
const hexWidth = Math.sqrt(3) * radius;

const expectCloseTo = ({ actual, expected }: { actual: Point; expected: Point }) => {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
};

describe("hexCenter", () => {
  test("places the origin cell at the origin", () => {
    expectCloseTo({
      actual: hexCenter({ cell: { axialQ: 0, axialR: 0 }, radius }),
      expected: { x: 0, y: 0 },
    });
  });

  test("places the next cell in a row one hex width to the right", () => {
    expectCloseTo({
      actual: hexCenter({ cell: { axialQ: 1, axialR: 0 }, radius }),
      expected: { x: hexWidth, y: 0 },
    });
  });

  test("shifts the next row half a hex to the right and one and a half radii down", () => {
    expectCloseTo({
      actual: hexCenter({ cell: { axialQ: 0, axialR: 1 }, radius }),
      expected: { x: hexWidth / 2, y: 1.5 * radius },
    });
  });
});

describe("hexCorners", () => {
  test("gives six corners on the radius, the first pointing up", () => {
    const center = { x: 5, y: 5 };

    const corners = hexCorners({ center, radius });

    expect(corners).toHaveLength(6);
    expectCloseTo({ actual: corners[0] ?? center, expected: { x: 5, y: 5 - radius } });
    for (const { x, y } of corners) expect(Math.hypot(x - 5, y - 5)).toBeCloseTo(radius);
  });
});

describe("gridBounds", () => {
  test("covers every hex up to its corners", () => {
    const bounds = gridBounds({
      cells: [
        { axialQ: 0, axialR: 0 },
        { axialQ: 1, axialR: 0 },
      ],
      radius,
    });

    expect(bounds.minX).toBeCloseTo(-hexWidth / 2);
    expect(bounds.minY).toBeCloseTo(-radius);
    expect(bounds.width).toBeCloseTo(2 * hexWidth);
    expect(bounds.height).toBeCloseTo(2 * radius);
  });
});
