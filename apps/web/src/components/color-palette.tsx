import type { HexCodeColor } from "@hexmote/domain";
import { cn } from "@/lib/utils";

type ColorPaletteProps = {
  palette: HexCodeColor[];
  selected: HexCodeColor;
  onSelect: (color: HexCodeColor) => void;
};

export function ColorPalette({ palette, selected, onSelect }: ColorPaletteProps) {
  return (
    <fieldset className="flex flex-wrap justify-center gap-1">
      <legend className="sr-only">Colour</legend>
      {palette.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={color === selected}
          className={cn(
            "size-7 rounded-md border border-border",
            color === selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color }}
          onClick={() => onSelect(color)}
        />
      ))}
    </fieldset>
  );
}
