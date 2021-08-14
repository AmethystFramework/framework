import { CommandContext } from "./commandContext.ts";

export interface Command {
  /** Command name */
  name: string;
  /** Command category */
  category?: string;
  /** Command aliases */
  aliases?: string[];
  /** Checks if the executor is an owner */
  ownerOnly?: boolean;
  /** Executes the command */
  execute?: (ctx: CommandContext) => Promise<void> | void;
}
