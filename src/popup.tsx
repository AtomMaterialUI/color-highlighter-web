import { useEffect, useState } from "react";
import { Theme, Flex, Text, Switch, Select, Box, Heading, Card, IconButton } from "@radix-ui/themes";
import { ColorWheelIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { ColorizationType, Settings } from "./types";
import "@radix-ui/themes/styles.css";

type Appearance = "light" | "dark";

const APPEARANCE_KEY = "appearance";

function getSystemAppearance(): Appearance {
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export default function IndexPopup() {
  const [enabled, setEnabled] = useState(true);
  const [colorizationType, setColorizationType] = useState<ColorizationType>("background");
  const [showSwatch, setShowSwatch] = useState(false);
  const [appearance, setAppearance] = useState<Appearance>(getSystemAppearance());

  useEffect(() => {
    chrome.storage.sync.get(["enabled", "colorizationType", "showSwatch", APPEARANCE_KEY], (result) => {
      const settings = result as Partial<Settings> & { [APPEARANCE_KEY]?: Appearance };
      if (settings.enabled !== undefined) setEnabled(settings.enabled);
      if (settings.colorizationType !== undefined) setColorizationType(settings.colorizationType);
      if (settings.showSwatch !== undefined) setShowSwatch(settings.showSwatch);
      if (settings[APPEARANCE_KEY]) setAppearance(settings[APPEARANCE_KEY]!);
    });
  }, []);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    chrome.storage.sync.set({ enabled: checked });
  };

  const handleTypeChange = (value: string) => {
    const type = value as ColorizationType;
    setColorizationType(type);
    chrome.storage.sync.set({ colorizationType: type });
  };

  const handleSwatchChange = (checked: boolean) => {
    setShowSwatch(checked);
    chrome.storage.sync.set({ showSwatch: checked });
  };

  const toggleAppearance = () => {
    const next: Appearance = appearance === "dark" ? "light" : "dark";
    setAppearance(next);
    chrome.storage.sync.set({ [APPEARANCE_KEY]: next });
  };

  return (
    <Theme accentColor="iris" panelBackground="translucent" appearance={appearance} hasBackground>
      <Box p="4" style={{ width: 280, minHeight: 180, backgroundColor: "var(--color-background)" }}>
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between" mb="2">
            <Flex align="center" gap="2">
              <ColorWheelIcon width="20" height="20" color="var(--iris-9)" />
              <Heading size="4">Color Highlighter</Heading>
            </Flex>
            <IconButton size="1" variant="ghost" onClick={toggleAppearance} aria-label="Toggle dark mode">
              {appearance === "dark" ? <SunIcon /> : <MoonIcon />}
            </IconButton>
          </Flex>

          <Card variant="surface">
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Text size="2" weight="bold">
                  Enabled
                </Text>
                <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  Colorization Type
                </Text>
                <Select.Root value={colorizationType} onValueChange={handleTypeChange}>
                  <Select.Trigger style={{ width: "100%" }} />
                  <Select.Content>
                    <Select.Item value="background">Background</Select.Item>
                    <Select.Item value="foreground">Foreground</Select.Item>
                    <Select.Item value="border">Border</Select.Item>
                    <Select.Item value="underline">Underline</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>

              <Flex justify="between" align="center">
                <Flex direction="column">
                  <Text size="2" weight="bold">
                    Inline swatch
                  </Text>
                </Flex>
                <Switch checked={showSwatch} onCheckedChange={handleSwatchChange} />
              </Flex>
            </Flex>
          </Card>

          <Text size="1" color="gray" align="center">
            Changes may require page refresh
          </Text>
        </Flex>
      </Box>
    </Theme>
  );
}
