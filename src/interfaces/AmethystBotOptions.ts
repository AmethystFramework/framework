import { DiscordenoMessage } from "../../deps.ts";
import { Async } from "../utils/types.ts";
import { AmethystBot } from "./bot.ts";
import { CommandCooldown } from "./command.ts";

export interface AmethystBotOptions {
  owners?: (bigint | string)[];
  prefix?:
    | string
    | string[]
    | ((
        bot: AmethystBot,
        message: DiscordenoMessage
      ) => Async<string | string[]>);
  botMentionAsPrefix?: boolean;
  defaultCooldown?: CommandCooldown;
  ignoreCooldown?: (string | bigint)[];
  guildOnly?: boolean;
  dmOnly?: boolean;
}
