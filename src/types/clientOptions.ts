import { BotConfig, DiscordenoMessage } from "../../deps.ts";
import { Awaited } from "../utils/types.ts";
/** The simple client's options */
// deno-lint-ignore no-empty-interface
export interface SimpleClientOptions extends Omit<BotConfig, "eventHandlers"> {}

interface dirs {
  commands?: string;
  events?: string;
  tasks?: string;
}

/** The command client's options which is an extension of the SimpleClientOptions */
export interface CommandClientOptions extends SimpleClientOptions {
  /** The prefix for the commands */
  prefix:
    | string
    | string[]
    | ((message: DiscordenoMessage) => Awaited<string | string[]>);
  /** The owner ids of the bot */
  ownerIds?: (bigint | string)[];
  /** The dir of your command folder */
  dirs?: dirs;
  /** Whether the bot is guild only */
  guildOnly?: boolean;
  /** Whether the bot is dms only */
  dmOnly?: boolean;
  /** A list of user ids who can surpass cooldowns */
  ignoreCooldown?: (bigint | string)[];
}
