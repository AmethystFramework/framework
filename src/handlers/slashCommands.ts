import { Interaction } from "../../deps.ts";
import { CommandClass } from "../classes/Command.ts";
import { createContext } from "../classes/Context.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystError, ErrorEnums } from "../interfaces/errors.ts";
import { createOptionResults } from "../utils/createOptionResults.ts";

/**
 * It handles the slash command
 * @param {AmethystBot} bot - AmethystBot - The bot instance
 * @param {Interaction} data - Interaction
 * @returns The data object
 */
export async function handleSlash(bot: AmethystBot, data: Interaction) {
  if (data.type !== 2 || !data.data?.name) {
    return;
  }
  let command: CommandClass | undefined;
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
    bot.inhibitors.some((e) => {
      let f = e(bot, command!, {
        guildId: data.guildId,
        channelId: data.channelId!,
        memberId: data.user.id,
      });
      return typeof f == "boolean" ? false : true;
    })
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
    await command.execute(
      bot,
      await createContext(
        {
          interaction: { ...data, data: data.data.options?.[0] },
        },
        createOptionResults(bot, command.args || [], {
          interaction: data,
        }),
        bot
      )
    );
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
