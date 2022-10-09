import { Interaction } from "../../deps.ts";
import { Command } from "../classes/Command.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystError, ErrorEnums } from "../interfaces/errors.ts";
import { createContext } from "../classes/Context.ts";
import { createOptionResults } from "../utils/createOptionResults.ts";

/**
 * Handles the slash command
 * @param bot The bot instance
 * @param data The slash command data
 */
export async function handleSlash(bot: AmethystBot, data: Interaction) {
  if (data.type !== 2 || !data.data?.name) {
    return;
  }
  let command: Command | undefined;
  for (let i = 0; i < bot.category.size; i++) {
    command = bot.category
      .at(i)
      ?.getCommandFromInteraction(data.data.name, data.data!.options![0]!.name);
    if (command) break;
  }
  if (!command) return;
  if (data.guildId && !bot.guilds.has(data.guildId)) {
    const guild = await bot.helpers.getGuild(data.guildId, { counts: true });
    if (!guild) throw "There was an issue fetching the guild";
    bot.guilds.set(data.guildId, guild);
  }
  if (data.guildId && data.member && !bot.members.has(data.user.id)) {
    bot.members.set(
      bot.transformers.snowflake(`${data.user.id}${data.guildId}`),
      await bot.helpers.getMember(data.guildId, data.user.id)
    );
  }
  if (data.channelId && !bot.channels.has(data.channelId)) {
    const channel = await bot.helpers.getChannel(data.channelId);
    if (!channel) throw "There was an issue fetching the command's channel";
    bot.channels.set(data.channelId, channel);
  }

  if (
    bot.inhibitors.some(
      (e) =>
        e(bot, command!, {
          guildId: data.guildId,
          channelId: data.channelId!,
          memberId: data.user.id,
        }) !== true
    )
  ) {
    return bot.events.commandError?.(bot, {
      data,
      error: bot.inhibitors
        .map((e) =>
          e(bot, command!, {
            guildId: data.guildId,
            channelId: data.channelId!,
            memberId: data.user.id,
          })
        )
        .find((e) => typeof e !== "boolean")! as AmethystError,
    });
  }
  try {
    bot.events.commandStart?.(bot, command, data);
    command.execute?.(bot, {
      ...createContext(
        {
          interaction: { ...data, data: data.data.options?.[0] },
        },
        bot
      ),
      options: createOptionResults(bot, command.args || [], {
        interaction: data,
      }),
    });
    bot.events.commandEnd?.(bot, command, data);
  } catch (e) {
    if (bot.events.commandError) {
      bot.events.commandError(bot, {
        error: { type: ErrorEnums.OTHER },
        data,
      });
    } else throw e;
  }
}
