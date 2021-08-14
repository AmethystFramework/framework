import { BotConfig, DiscordenoMessage } from "../../deps.ts";

// deno-lint-ignore no-empty-interface
export interface SimpleClientOptions extends Omit<BotConfig, "eventHandlers"> {}

export interface CommandClientOptions extends SimpleClientOptions {
  /** The prefix for the commands */
  prefix: string | ((message: DiscordenoMessage) => Promise<string> | string);
  /** The owner ids of the bot */
  ownerIds?: (bigint | string)[];
}
