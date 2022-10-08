import { CreateMessage, Interaction, Message } from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";
import { optionResults } from "./commandOptions.ts";

export type context = {
  channelId: bigint;
  guildId?: bigint;
  authorId: bigint;
  member?: Message["member"];
  options: optionResults;
  message: Interaction | Message;
  /**Defers the interaction response*/
  defer(bot: AmethystBot): Promise<unknown>;
  respond(
    bot: AmethystBot,
    content: CreateMessage & {
      private?: boolean;
      /**only useful for force fetching the interaction response*/ force: true;
    }
  ): Promise<Message>;
  respond(
    bot: AmethystBot,
    content: CreateMessage & {
      private?: boolean;
      /**only useful for force fetching the interaction response*/ force?: false;
    }
  ): Promise<Message | undefined>;

  reply(
    bot: AmethystBot,
    content: CreateMessage & {
      private?: boolean;
      /**only useful for force fetching interaction response*/ force: true;
    }
  ): Promise<Message>;
  reply(
    bot: AmethystBot,
    content: CreateMessage & {
      private?: boolean;
      /**Only useful to send a deferred reply for a slash command*/ defer?: boolean;
      /**only useful for force fetching interaction response*/ force?: false;
    }
  ): Promise<Message | undefined>;
};
