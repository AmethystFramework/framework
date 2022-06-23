import { Message } from "../../deps.ts";
import { Async } from "../utils/types.ts";
import { AmethystBot } from "./bot.ts";
import { CommandCooldown } from "./command.ts";

/**A list of options for the amethyst bot*/
export type AmethystBotOptions =
  & {
    owners?: (bigint | string)[];
    prefix?:
      | string
      | string[]
      | ((bot: AmethystBot, message: Message) => Async<string | string[]>);
    botMentionAsPrefix?: boolean;
    defaultCooldown?: CommandCooldown;
    ignoreCooldown?: (string | bigint)[];
    commandDir?: string;
    eventDir?: string;
    inhibitorDir?: string;
  }
  & (
    | {
      guildOnly?: true;
      dmOnly?: false;
    }
    | {
      guildOnly?: false;
      dmOnly: true;
    }
  );
