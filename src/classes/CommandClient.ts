import { Collection, startBot } from "../../deps.ts";
import { executeNormalCommand } from "../monitors/mod.ts";
import { CommandClientOptions } from "../types/clientOptions.ts";
import { Command } from "../types/Command.ts";
import { CommandClientEvents } from "../types/eventHandlers.ts";
import { SimpleClient } from "./SimpleClient.ts";

export class CommandClient extends SimpleClient {
  public readonly prefix: CommandClientOptions["prefix"];
  public readonly commands: Collection<string, Command> = new Collection();
  public readonly options: CommandClientOptions;
  public readonly guildsOnly: boolean;
  public readonly dmsOnly: boolean;
  public eventHandlers: Partial<CommandClientEvents> = {};
  constructor(options: CommandClientOptions) {
    super(options);
    this.prefix = options.prefix;
    this.options = options;
    if (options.dmOnly && options.guildOnly)
      throw "The command client can't be dms only and guilds only at the same time";
    this.guildsOnly = options.guildOnly ?? false;
    this.dmsOnly = options.dmOnly ?? false;
  }

  /** Creates a command */
  addCommand(command: Command) {
    this.commands.set(command.name, {
      ...command,
      category: command.category || "misc",
    });
    this.eventHandlers.commandAdd?.(command);
  }

  /** Creates a command */
  deleteCommand(command: Command) {
    this.commands.delete(command.name);
    this.eventHandlers.commandAdd?.(command);
  }

  /** Loads a command file */
  async load(dir: string) {
    const cmdClass = await import(`file://${Deno.realPathSync(dir)}`);
    const cmd: Command = new cmdClass.default();
    this.addCommand(cmd);
    return cmd;
  }

  /** Load all commands in a directory */
  async loadAll(path?: string): Promise<void> {
    if (!path && !this.options.commandDir)
      throw "You have to specify a path or setup a command dir.";
    path = (path || this.options.commandDir)!.replaceAll("\\", "/");
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
    return await startBot({
      ...this.options,
      eventHandlers: {
        ...this.eventHandlers,
        messageCreate: (message) => {
          executeNormalCommand(this, message);
          this.eventHandlers.messageCreate?.(message);
        },
      },
    });
  }
}
