import { EventHandlers } from "../../deps.ts";
import { Command } from "./Command.ts";
import { CommandContext } from "./commandContext.ts";

// deno-lint-ignore no-empty-interface
export interface SimpleClientEvents extends EventHandlers {}

export interface CommandClientEvents extends SimpleClientEvents {
  /** Executes when a command is added */
  commandAdd: (command: Command) => Promise<void> | void;
  /** Executes when a command is deleted */
  commandRemove: (command: Command) => Promise<void> | void;
  /** Executes before a command gets executed */
  commandStart: (command: Command, ctx: CommandContext) => Promise<void> | void;
  /** Executes after a command gets executed */
  commandEnd: (command: Command, ctx: CommandContext) => Promise<void> | void;
}
