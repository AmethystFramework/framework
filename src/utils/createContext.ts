import { Interaction, Message } from "../../deps.ts";
import { context } from "../interfaces/context.ts";

export function createContext<
  T extends "application" | "message" = never
>(data: { interaction?: Interaction; message?: Message }): context<T> {
  return {
    ...data,
    channelId: (data.interaction?.channelId || data.message?.channelId)!,
    authorId: (data.message?.authorId ||
      data.interaction?.user.id ||
      data.interaction?.member?.id)!,
    member: data.interaction?.member || data.message?.member,
    guildId: data.interaction?.guildId || data.message?.guildId,
    async defer(bot) {
      if (data.interaction)
        return await bot.helpers.sendInteractionResponse(
          data.interaction.id,
          data.interaction.token,
          { type: 5 }
        );
    },
    // @ts-ignore -
    reply: async (bot, content) => {
      if (data.message) {
        const msg = await bot.helpers.sendMessage(data.message.channelId, {
          ...content,
          messageReference: {
            messageId: data.message.id,
            channelId: data.message.channelId,
            guildId: data.message.guildId,
            failIfNotExists: false,
          },
        });
        if (content.private)
          bot.helpers.deleteMessage(msg.channelId, msg.id, undefined, 5000);
        return msg;
      } else if (data.interaction) {
        return (
          (await bot.helpers.sendInteractionResponse(
            data.interaction.id,
            data.interaction.token,
            {
              type: 4,
              data: { ...content, flags: content.private ? 1 << 6 : undefined },
            }
          )) ||
          (content.force
            ? await bot.helpers.getOriginalInteractionResponse(
                data.interaction.token
              )
            : undefined)
        );
      }
    },
    // @ts-ignore -
    respond: async (bot, content) => {
      if (data.message) {
        const msg = await bot.helpers.sendMessage(data.message.channelId, {
          ...content,
        });
        if (content.private)
          bot.helpers.deleteMessage(msg.channelId, msg.id, undefined, 5000);
        return msg;
      } else if (data.interaction) {
        return (
          (await bot.helpers.sendInteractionResponse(
            data.interaction.id,
            data.interaction.token,
            {
              type: 4,
              data: { ...content, flags: content.private ? 1 << 6 : undefined },
            }
          )) ||
          (content.force
            ? await bot.helpers.getOriginalInteractionResponse(
                data.interaction.token
              )
            : undefined)
        );
      }
    },
  } as context<T>;
}
