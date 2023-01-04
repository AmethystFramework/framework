import { Interaction } from '../../deps.ts';
import { CommandClass } from '../classes/Command.ts';
import { createContext } from '../classes/Context.ts';
import { AmethystBot } from '../interfaces/bot.ts';
import { ErrorEnums } from '../interfaces/errors.ts';
import { createOptionResults } from '../utils/createOptionResults.ts';

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
  const context = await createContext(
    {
      interaction: { ...data, data: data.data.options?.[0] },
    },
    createOptionResults(bot, command.args || [], {
      interaction: data,
    }),
    bot
  );
  for (let i = 0; i < bot.inhibitors.size; i++) {
    const e = bot.inhibitors.at(i)!;
    const f = await e(bot, command, context);

    if (typeof f != "boolean") {
      return bot.events.commandError?.(bot, {
        data,
        error: f,
      }, context);
    }
  }
  try {
    bot.events.commandStart?.(bot, command, data);
    await command.execute(
      bot,
      context
    );
    bot.events.commandEnd?.(bot, command, data);
  } catch (e) {
    if (bot.events.commandError) {
      bot.events.commandError(bot, {
        error: { type: ErrorEnums.COMMANDRUNTIME },
        data,
      }, context);
    } else throw e;
  }
}
