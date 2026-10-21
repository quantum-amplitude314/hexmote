import { join } from "node:path";
import { convertIndexedToRgb, decode } from "fast-png";
import { buildTemplate, placePalette } from "../src/index.ts";

const source = {
  emoji: "1F600 grinning face",
  url: "https://raw.githubusercontent.com/hfg-gmuend/openmoji/17.0.0/color/618x618/1F600.png",
  license: "OpenMoji, CC BY-SA 4.0",
};
const cellsAcross = 40;
const outputPath = join(import.meta.dir, "../generated/grinning-face.json");

const response = await fetch(source.url);
if (!response.ok) throw new Error(`Download failed with ${response.status}`);
const png = decode(await response.arrayBuffer());
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
