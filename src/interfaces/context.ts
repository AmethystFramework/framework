import { CreateMessage, Interaction, Message } from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";

// This type is still not used but it is still expiremental
export type context<
  T extends ("message" | "application") = never,
> =
  & {
    channelId: bigint;
    guildId?: bigint;
    authorId: bigint;
    member?: Message["member"];
    respond(
      bot: AmethystBot,
      content: CreateMessage & { private: boolean; force: true },
    ): Promise<Message>;
    respond(
      bot: AmethystBot,
      content: CreateMessage & { private: boolean; force?: false },
    ): Promise<Message | undefined>;

    reply(
      bot: AmethystBot,
      content: CreateMessage & { private: boolean; force: true },
    ): Promise<Message>;
    reply(
      bot: AmethystBot,
      content: CreateMessage & { private: boolean; force?: false },
    ): Promise<Message | undefined>;
  }
  & ("message" extends T ? { message: Message }
    : { message?: Message })
  & ("application" extends T ? { interaction: Interaction }
    : { interaction?: Interaction });
