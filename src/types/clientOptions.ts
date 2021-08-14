import { BotConfig, DiscordenoMessage } from "../../deps.ts";

// deno-lint-ignore no-empty-interface
export interface SimpleClientOptions extends Omit<BotConfig, "eventHandlers"> {}

export interface CommandClientOptions extends SimpleClientOptions {
  prefix: string | ((message: DiscordenoMessage) => Promise<string> | string);
  ownerIds?: (bigint | string)[];
}
