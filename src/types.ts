export type ColorizationType = "background" | "foreground" | "border" | "underline";

export interface Settings {
  enabled: boolean;
  colorizationType: ColorizationType;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  colorizationType: "background",
};
