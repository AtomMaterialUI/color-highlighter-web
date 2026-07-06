import type { ColorMatch } from "./colorDetector";

let worker: Worker | null = null;
let nextId = 0;
const pendingRequests = new Map<
  number,
  {
    resolve: (matches: ColorMatch[]) => void;
    reject: (err: any) => void;
  }
>();

/**
 * Initialize or get the existing worker
 */
function getWorker(): Worker {
  if (!worker) {
    // Plasmo handles the worker bundling via URL constructor
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event) => {
      const { matches, id, error } = event.data;
      const request = pendingRequests.get(id);

      if (request) {
        pendingRequests.delete(id);
        if (error) {
          request.reject(new Error(error));
        } else {
          request.resolve(matches);
        }
      }
    };

    worker.onerror = (error) => {
      console.error("Color detection worker error:", error);
      // Reject all pending requests
      for (const request of pendingRequests.values()) {
        request.reject(error);
      }
      pendingRequests.clear();
      worker = null;
    };
  }
  return worker;
}

/**
 * Detect colors in text asynchronously using a Web Worker
 */
export function detectColorsAsync(text: string): Promise<ColorMatch[]> {
  // For very short strings, the overhead of worker communication might not be worth it,
  // but for consistency we use the worker for everything if requested.
  // Optimization: use synchronous detection for strings under 500 chars?
  // Let's stick to worker for now to fulfill the user's request.

  return new Promise((resolve, reject) => {
    const id = nextId++;
    pendingRequests.set(id, { resolve, reject });

    try {
      getWorker().postMessage({ text, id });
    } catch (error) {
      pendingRequests.delete(id);
      reject(error);
    }
  });
}

/**
 * Terminate the worker if it's no longer needed
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
}
