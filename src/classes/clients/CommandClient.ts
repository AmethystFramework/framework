import { startBot } from "../../../deps.ts";
import { executeNormalCommand } from "../../monitors/mod.ts";
import {
  CommandClientOptions,
  Command,
  CommandClientEvents,
  CommandCooldown,
} from "../../types/mod.ts";
import { AmethystCollection } from "../../utils/mod.ts";
import { CommandClass, AmethystTask, ArgumentGenerator } from "../mod.ts";
import { SimpleClient } from "./SimpleClient.ts";

interface runningInterval {
  taskName: string;
  interval: number;
}

/** The client that is used for creating commands  */
export class CommandClient extends SimpleClient {
  /** The bot's prefix */
  public readonly prefix: CommandClientOptions["prefix"];
  /** A collection that keeps all the bot's commands */
  // deno-lint-ignore no-explicit-any
  public readonly commands: AmethystCollection<string, Command<any>> =
    new AmethystCollection();
  /** A collection of arguments */
  public readonly argumentGenerator: ArgumentGenerator =
    new ArgumentGenerator();
  /** The client's options */
  public readonly options: CommandClientOptions;
  /** Checks whether the bot should only respond to commands in guilds */
  public readonly guildsOnly: boolean;
  /** Checks whether the bot should only respond to commands in dms */
  public readonly dmsOnly: boolean;
  /** A list of user ids that can surpass cooldowns */
  public readonly ignoreCooldown: bigint[];
  /** The default cooldown amount */
  public readonly defaultCooldown?: CommandCooldown;
  /** If all tasks are loaded by the handleTasks */
  private tasksReady = false;
  /** An object that contains all the command client's event functions */
  public eventHandlers: Partial<CommandClientEvents> = {};
  /** A collection that contains all available tasks */
  public tasks: AmethystCollection<string, AmethystTask> =
    new AmethystCollection();
  private runningTasks = {
    initialTimeouts: [] as number[],
    intervals: [] as runningInterval[],
  };

  constructor(options: CommandClientOptions) {
    super(options);
    this.prefix = options.prefix;
    this.options = options;
    if (options.dmOnly && options.guildOnly)
      throw "The command client can't be dms only and guilds only at the same time";
    this.guildsOnly = options.guildOnly ?? false;
    this.dmsOnly = options.dmOnly ?? false;
    this.ignoreCooldown = options.ignoreCooldown?.map((e) => BigInt(e)) ?? [];
    this.defaultCooldown = options.defaultCooldown;
  }

  /** Creates a command */
  // deno-lint-ignore no-explicit-any
  addCommand(command: Command<any>): void {
    this.commands.set(command.name, {
      ...command,
      category: command.category || "misc",
    });
    this.eventHandlers.commandAdd?.(command);
  }

  /** Deletes a command */
  // deno-lint-ignore no-explicit-any
  deleteCommand(command: Command<any>) {
    this.commands.delete(command.name);
    this.eventHandlers.commandRemove?.(command);
  }

  /** Creates a task */
  addTask(task: AmethystTask) {
    this.tasks.set(task.name, task);
    if (this.tasksReady) {
      if (task.startOnReady) task.execute();
      this.runningTasks.initialTimeouts.push(
        setTimeout(async () => {
          await task.execute();
          this.runningTasks.intervals.push({
            taskName: task.name,
            interval: setInterval(task.execute, task.interval),
          });
        }, task.interval - (Date.now() % task.interval))
      );
    }
  }

  /** Deletes a task */
  deleteTask(task: AmethystTask) {
    if (!this.tasks.has(task.name)) return;
    clearInterval(
      this.runningTasks.intervals.find((e) => e.taskName == task.name)
        ?.interval!
    );
    this.tasks.delete(task.name);
  }

  /** Loads a command file */
  async load(dir: string) {
    const Class = await import(`file://${Deno.realPathSync(dir)}`);
    if (!Class.default) return;
    // deno-lint-ignore no-explicit-any
    const returned: CommandClass<any> | AmethystTask = new Class.default();
    if (returned.type == "Command") this.addCommand(returned);
    else this.addTask(returned);
    return returned;
  }

  private handleTasks() {
    this.tasks.forEach(async (task) => {
      if (task.startOnReady) await task.execute();
      this.runningTasks.initialTimeouts.push(
        setTimeout(async () => {
          await task.execute();
          this.runningTasks.intervals.push({
            taskName: task.name,
            interval: setInterval(task.execute, task.interval),
          });
        }, task.interval - (Date.now() % task.interval))
      );
    });
    this.tasksReady = true;
  }

  /** Load all commands in a directory */
  async loadAll(path: string): Promise<void> {
    path = path.replaceAll("\\", "/");
    const files = Deno.readDirSync(Deno.realPathSync(path));
    for (const file of files) {
      if (!file.name) continue;
      const currentPath = `${path}/${file.name}`;
      if (file.isFile) {
        if (!currentPath.endsWith(".ts")) continue;
        await this.load(currentPath);
        continue;
      }
      this.loadAll(currentPath);
    }
  }

  /** Start the bot */
  async start(): Promise<void> {
    if (!this.guildsOnly && !this.options.intents.includes("DirectMessages"))
      this.options.intents.push("DirectMessages");
    if (!this.dmsOnly && !this.options.intents.includes("GuildMessages"))
      this.options.intents.push("GuildMessages");
    if (this.options.dirs)
      for (const dir of Object.values(this.options.dirs)) {
        await this.loadAll(dir);
      }
    return await startBot({
      ...this.options,
      eventHandlers: {
        ...this.eventHandlers,
        ready: () => {
          if (!this.tasksReady) this.handleTasks();
          this.eventHandlers.ready?.();
        },
        messageCreate: (message) => {
          executeNormalCommand(this, message);
          this.eventHandlers.messageCreate?.(message);
        },
      },
    });
  }
}
