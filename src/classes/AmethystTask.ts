import { Awaited } from "../utils/mod.ts";

interface TaskOptions {
  name: string;
  startOnReady?: boolean;
  interval: number;
  execute?: () => Awaited<void>;
}

export class AmethystTask {
  /** The task name */
  public readonly name: string;
  /** The class type */
  public readonly type = "Task";
  /** If the task should start once the bot is ready without waiting the interval duration (defaults to false) */
  public readonly startOnReady?: boolean = false;
  /** The duration between eachtime the task executes */
  public readonly interval: number;
  /** The task execute function */
  public execute: () => Awaited<void>;
  constructor(options: TaskOptions) {
    this.name = options.name;
    this.startOnReady = options.startOnReady ?? false;
    this.interval = options.interval;
    this.execute = options.execute ?? (() => {});
  }
}
