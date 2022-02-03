/**The task that will be running through an interval*/
export interface AmethystTask {
  /**The task's name*/
  name: string;
  /**The amount of milliseconds before it runs again*/
  interval: number;
  execute: () => unknown;
}
