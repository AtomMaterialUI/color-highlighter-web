export type ColorizationType = "background" | "foreground" | "border" | "underline";

export type Appearance = "light" | "dark";

export interface Settings {
  enabled: boolean;
  colorizationType: ColorizationType;
  showSwatch: boolean;
  appearance?: Appearance;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  colorizationType: "background",
  showSwatch: false,
};
