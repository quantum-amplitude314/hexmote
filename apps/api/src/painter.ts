import type { Painter } from "@hexmote/contracts";

type NonEmpty<Item> = readonly [Item, ...Item[]];

// The palette without white and silver: names are shown in their colour on a white page.
const colors: NonEmpty<Painter> = [
  { name: "Grey", color: "#888888" },
  { name: "Black", color: "#222222" },
  { name: "Pink", color: "#ffa7d1" },
  { name: "Red", color: "#e50000" },
  { name: "Orange", color: "#e59500" },
  { name: "Brown", color: "#a06a42" },
  { name: "Yellow", color: "#e5d900" },
  { name: "Lime", color: "#94e044" },
  { name: "Green", color: "#02be01" },
  { name: "Cyan", color: "#00d3dd" },
  { name: "Blue", color: "#0083c7" },
  { name: "Indigo", color: "#0000ea" },
  { name: "Violet", color: "#cf6ee4" },
  { name: "Purple", color: "#820080" },
];

const animals: NonEmpty<string> = [
  "Fox",
  "Owl",
  "Bear",
  "Wolf",
  "Otter",
  "Hare",
  "Lynx",
  "Crow",
  "Deer",
  "Seal",
  "Frog",
  "Swan",
  "Mole",
  "Wren",
  "Newt",
  "Puma",
  "Panda",
  "Tiger",
  "Whale",
  "Koala",
  "Bison",
  "Moose",
  "Gecko",
  "Heron",
];

/** FNV-1a: the same session always hashes to the same name. */
const hashOf = (text: string) => {
  let hash = 0x811c9dc5;
  for (const character of text) {
    hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 0x01000193);
  }
  const unsigned = hash >>> 0;

  return unsigned;
};

const pick = <Item>({ items, index }: { items: NonEmpty<Item>; index: number }) =>
  items[index % items.length] ?? items[0];

export const painterOf = (sessionId: string) => {
  const hash = hashOf(sessionId);
  const { name: colorName, color } = pick({ items: colors, index: hash });
  const animal = pick({ items: animals, index: Math.floor(hash / colors.length) });
  const painter: Painter = { name: `${colorName} ${animal}`, color };

  return painter;
};
