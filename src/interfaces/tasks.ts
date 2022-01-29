export interface AmethystTask {
  name: string;
  interval: number;
  execute: () => unknown;
}
