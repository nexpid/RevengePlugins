import { getAssetByID } from "@vendetta/ui/assets";
import { PlusStructure } from "../types";
import { matchTheme } from "../stuff/themeMatch";

export function getIconTint(
  plus: PlusStructure,
  icon: number,
  customName?: string
): string | undefined {
  const name = customName ?? getAssetByID(icon)?.name;
  if (!name) return;
  if (!plus.icons[name]) return;

  const colors = plus.icons[name];
  return Array.isArray(colors)
    ? matchTheme({
        dark: colors[0],
        light: colors[1],
        amoled: colors[2],
        darker: colors[3],
      })
    : colors;
}

export function asIcon(
  plus: PlusStructure,
  customName: string,
  img: React.JSX.Element
): React.JSX.Element {
  if (typeof img.props.source === "number") {
    const clr = getIconTint(plus, img.props.source, customName);
    if (clr)
      addToStyle(img.props, {
        tintColor: clr,
      });
  }
  img.props.ignore = true;
  return img;
}