import { EventHandlers } from "../../deps.ts";
import { CommandContext, Command } from "./mod.ts";
import { AmethystError } from "./error.ts";
import { Awaited } from "../utils/types.ts";

/** The simple client events */
// deno-lint-ignore no-empty-interface
export interface SimpleClientEvents extends EventHandlers {}

/** The command client's events which extends the simple client's */
export interface CommandClientEvents extends SimpleClientEvents {
  /** Executes when a command is added */
  // deno-lint-ignore no-explicit-any
  commandAdd: (command: Command<any>) => Awaited<void>;
  /** Executes when a command is deleted */
  // deno-lint-ignore no-explicit-any
  commandRemove: (command: Command<any>) => Awaited<void>;
  /** Executes before a command gets executed */
  commandStart: (
    // deno-lint-ignore no-explicit-any
    command: Command<any>,
    // deno-lint-ignore no-explicit-any
    ctx: CommandContext<any>
  ) => Awaited<void>;
  /** Executes after a command gets executed */
  commandEnd: (
    // deno-lint-ignore no-explicit-any
    command: Command<any>,
    // deno-lint-ignore no-explicit-any
    ctx: CommandContext<any>
  ) => Awaited<void>;
  /** Executes when a check fails in the command */
  // deno-lint-ignore no-explicit-any
  commandFail: (command: Command<any>, error: AmethystError) => Awaited<void>;
}
