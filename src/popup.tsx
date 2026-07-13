import { useEffect, useState } from "react";
import { Theme, Flex, Text, Switch, Select, Box, Heading, Card, IconButton } from "@radix-ui/themes";
import { ColorWheelIcon, Cross1Icon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import browser from "webextension-polyfill";
import { ColorizationType, Settings, DEFAULT_SETTINGS } from "./types";
import {
  addDisabledSite,
  getSettings,
  initSettings,
  removeDisabledSite,
  saveSettings,
  subscribeSettings,
  withAppearance,
} from "./utils/settingsStore";
import "@radix-ui/themes/styles.css";

/**
 * Resolve the hostname of the currently active tab, if any. Returns null when
 * the popup is opened outside of a normal http(s) page (chrome://, about:, etc.).
 */
async function getCurrentTabHostname(): Promise<string | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;

    const url = new URL(tab.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export default function IndexPopup() {
  const [settings, setSettings] = useState<Settings>(() => withAppearance({ ...DEFAULT_SETTINGS }));
  const [currentHost, setCurrentHost] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    initSettings().then((loaded) => {
      setSettings(withAppearance(loaded));
      unsub = subscribeSettings((next) => setSettings(withAppearance(next)));
    });

    getCurrentTabHostname().then(setCurrentHost);

    return () => {
      unsub?.();
    };
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = {
      ...getSettings(),
      ...patch,
    };
    setSettings(withAppearance(next));
    saveSettings(next);
  };

  const toggleAppearance = () => {
    update({
      appearance: settings.appearance === "dark" ? "light" : "dark",
    });
  };

  const isCurrentSiteEnabled = !!currentHost && !settings.disabledSites.includes(currentHost);

  const toggleCurrentSite = (enabled: boolean) => {
    if (!currentHost) return;

    if (enabled) {
      removeDisabledSite(currentHost);
    }
    else {
      addDisabledSite(currentHost);
    }
  };

  return (
    <Theme accentColor="teal" panelBackground="translucent" appearance={settings.appearance} hasBackground>
      <Box p="4" style={{ width: 280, minHeight: 180, backgroundColor: "var(--color-background)" }}>
        <Flex direction="column" gap="4">
          <Flex align="center" justify="between" mb="2">
            <Flex align="center" gap="2">
              <ColorWheelIcon width="20" height="20" color="var(--teal-9)" />
              <Heading size="4">Color Highlighter</Heading>
            </Flex>
            <IconButton size="1" variant="ghost" onClick={toggleAppearance} aria-label="Toggle dark mode">
              {settings.appearance === "dark" ? <SunIcon /> : <MoonIcon />}
            </IconButton>
          </Flex>

          <Card variant="surface">
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Text size="2" weight="bold">
                  Enabled
                </Text>
                <Switch checked={settings.enabled} onCheckedChange={(checked) => update({ enabled: checked })} />
              </Flex>

              <Flex justify="between" align="center">
                <Flex direction="column" style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                  <Text size="2" weight="bold">
                    Enabled on this site
                  </Text>
                  <Text
                    size="1"
                    color="gray"
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {currentHost ?? "Not available on this page"}
                  </Text>
                </Flex>
                <Switch
                  checked={isCurrentSiteEnabled}
                  disabled={!currentHost}
                  onCheckedChange={toggleCurrentSite}
                />
              </Flex>

              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  Colorization Type
                </Text>
                <Select.Root
                  value={settings.colorizationType}
                  onValueChange={(value) => update({ colorizationType: value as ColorizationType })}
                >
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
                  <Text size="1" color="gray">
                    Show a small color swatch next to each colorized value
                  </Text>
                </Flex>
                <Switch checked={settings.showSwatch} onCheckedChange={(checked) => update({ showSwatch: checked })} />
              </Flex>

              <Flex justify="between" align="center">
                <Flex direction="column">
                  <Text size="2" weight="bold">
                    Force Detect
                  </Text>
                  <Text size="1" color="gray">
                    Enable on all websites' <code>&lt;code&gt;</code> and <code>&lt;pre&gt;</code> blocks
                  </Text>
                </Flex>
                <Switch checked={settings.forceDetect} onCheckedChange={(checked) => update({ forceDetect: checked })} />
              </Flex>
            </Flex>
          </Card>

          {settings.disabledSites.length > 0 && (
            <Card variant="surface">
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  Disabled sites
                </Text>
                <Flex direction="column" gap="1">
                  {settings.disabledSites.map((host) => (
                    <Flex key={host} justify="between" align="center" gap="2">
                      <Text
                        size="1"
                        style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}
                      >
                        {host}
                      </Text>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        aria-label={`Re-enable ${host}`}
                        onClick={() => removeDisabledSite(host)}
                      >
                        <Cross1Icon />
                      </IconButton>
                    </Flex>
                  ))}
                </Flex>
              </Flex>
            </Card>
          )}

          <Text size="1" color="gray" align="center">
            Changes may require page refresh.
          </Text>

          <Text size="1" color="amber" align="center">
            This extension doesn't work on large files.
          </Text>
        </Flex>
      </Box>
    </Theme>
  );
}
