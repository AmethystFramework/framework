import { CreateMessage, Interaction, Message } from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";
import { optionResults } from "./commandOptions.ts";

// This type is still not used but it is still expiremental
export type context<T extends "application" | "message" = never> = {
  channelId: bigint;
  guildId?: bigint;
  authorId: bigint;
  member?: Message["member"];
  options: optionResults;
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
      /**only useful for force fetching interaction response*/ force?: false;
    }
  ): Promise<Message | undefined>;
} & ("application" extends T
  ? { interaction: Interaction }
  : { interaction?: Interaction }) &
  ("message" extends T ? { message: Message } : { message?: Message });
