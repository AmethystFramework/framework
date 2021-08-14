import { EventHandlers } from "../../deps.ts";
import { Command } from "./Command.ts";
import { CommandContext } from "./commandContext.ts";

// deno-lint-ignore no-empty-interface
export interface SimpleClientEvents extends EventHandlers {}

export interface CommandClientEvents extends SimpleClientEvents {
  commandAdd: (command: Command) => Promise<void> | void;
  commandRemove: (command: Command) => Promise<void> | void;
  commandStart: (command: Command, ctx: CommandContext) => Promise<void> | void;
  commandEnd: (command: Command, ctx: CommandContext) => Promise<void> | void;
}
