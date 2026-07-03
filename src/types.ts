export type ColorizationType = "background" | "foreground" | "border" | "underline";

export interface Settings {
  enabled: boolean;
  colorizationType: ColorizationType;
  /** Show an inline color swatch next to each detected color token. */
  showSwatch: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  colorizationType: "background",
  showSwatch: false,
};
