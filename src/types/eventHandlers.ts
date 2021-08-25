import { EventHandlers } from "../../deps.ts";
import { CommandContext, Command } from "./mod.ts";
import { AmethystError } from "./error.ts";

/** The simple client events */
// deno-lint-ignore no-empty-interface
export interface SimpleClientEvents extends EventHandlers {}

/** The command client's events which extends the simple client's */
export interface CommandClientEvents extends SimpleClientEvents {
  /** Executes when a command is added */
  commandAdd: (command: Command) => Promise<void> | void;
  /** Executes when a command is deleted */
  commandRemove: (command: Command) => Promise<void> | void;
  /** Executes before a command gets executed */
  commandStart: (command: Command, ctx: CommandContext) => Promise<void> | void;
  /** Executes after a command gets executed */
  commandEnd: (command: Command, ctx: CommandContext) => Promise<void> | void;
  /** Executes when a check fails in the command */
  commandFail: (command: Command, error: AmethystError) => Promise<void> | void;
}
