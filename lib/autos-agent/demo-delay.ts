/** Simulated API latency for demo/mock mode (300–800ms). */

export function demoDelay(minMs = 300, maxMs = 800): Promise<void> {
  const ms = minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  return new Promise((resolve) => setTimeout(resolve, ms));
}
