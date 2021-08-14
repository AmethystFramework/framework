import { Collection } from "../../deps.ts";
import { executeCommand } from "../monitors/command_handler.ts";
import { CommandClientOptions } from "../types/clientOptions.ts";
import { Command } from "../types/Command.ts";
import { CommandClientEvents } from "../types/eventHandlers.ts";
import { SimpleClient } from "./SimpleClient.ts";

export class CommandClient extends SimpleClient {
  public readonly prefix: CommandClientOptions["prefix"];
  public readonly commands: Collection<string, Command> = new Collection();
  public readonly options: CommandClientOptions;
  public eventHandlers: Partial<CommandClientEvents> = {};
  constructor(options: CommandClientOptions) {
    super(options);
    this.prefix = options.prefix;
    this.options = options;
    this.eventHandlers.messageCreate = (message) => {
      executeCommand(this, message);
    };
  }

  addCommand(command: Command) {
    this.commands.set(command.name, {
      ...command,
      category: command.category || "misc",
    });
    this.eventHandlers.commandAdd?.(command);
  }
}
