import { join } from "node:path";
import { convertIndexedToRgb, decode } from "fast-png";
import { buildTemplate, placePalette } from "../src/index.ts";

const source = { emoji: "1F600 grinning face", image: "source/grinning-face.png" };
const cellsAcross = 40;
const sourcePath = join(import.meta.dir, "..", source.image);
const outputPath = join(import.meta.dir, "../generated/grinning-face.json");

const png = decode(await Bun.file(sourcePath).arrayBuffer());
const { width, height, palette: indexedColors } = png;
const rgba = indexedColors ? convertIndexedToRgb(png) : new Uint8Array(png.data);
if (png.depth !== 8 || rgba.length !== width * height * 4) {
  throw new Error(`Expected 8-bit RGBA, got ${png.depth}-bit with ${png.channels} channels`);
}
const template = buildTemplate({
  pixels: { width, height, rgba },
  cellsAcross,
  palette: placePalette,
});
await Bun.write(
  outputPath,
  JSON.stringify({ source, cellsAcross, palette: placePalette, template }),
);
console.log(`${template.length} cells → ${outputPath}`);
