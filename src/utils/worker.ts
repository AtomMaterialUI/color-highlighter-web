import { detectColors } from "~utils/colorDetector";

self.onmessage = (event) => {
  const { text, id } = event.data;
  if (typeof text !== "string") return;

  try {
    const matches = detectColors(text);
    self.postMessage({ matches, id });
  } catch (error) {
    self.postMessage({ error: (error as Error).message, id });
  }
};
