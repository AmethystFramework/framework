import { CommandContext } from "./commandContext.ts";

export interface Command {
  name: string;
  category?: string;
  aliases?: string[];
  ownerOnly?: boolean;
  execute?: (ctx: CommandContext) => Promise<void> | void;
}
