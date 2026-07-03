import { useEffect, useState } from "react";
import { Theme, Flex, Text, Switch, Select, Box, Heading, Card } from "@radix-ui/themes";
import { ColorWheelIcon } from "@radix-ui/react-icons";
import { ColorizationType, Settings } from "./types";
import "@radix-ui/themes/styles.css";

export default function IndexPopup() {
  const [enabled, setEnabled] = useState(true);
  const [colorizationType, setColorizationType] = useState<ColorizationType>("background");

  useEffect(() => {
    chrome.storage.sync.get(["enabled", "colorizationType"], (result) => {
      const settings = result as Partial<Settings>;
      if (settings.enabled !== undefined) {
        setEnabled(settings.enabled);
      }
      if (settings.colorizationType !== undefined) {
        setColorizationType(settings.colorizationType);
      }
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

  return (
    <Theme accentColor="iris" panelBackground="translucent">
      <Box p="4" style={{ width: 280, minHeight: 180 }}>
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2" mb="2">
            <ColorWheelIcon width="20" height="20" color="var(--iris-9)" />
            <Heading size="4">Color Highlighter</Heading>
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
