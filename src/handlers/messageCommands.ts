import { Message } from "../../deps.ts";
import { CommandClass } from "../classes/Command.ts";
import { createContext } from "../classes/Context.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { ErrorEnums } from "../interfaces/errors.ts";
import { createOptionResults } from "../utils/createOptionResults.ts";

/**
 * It executes a command
 * @param {AmethystBot} bot - AmethystBot - The bot instance
 * @param {Message} message - Message - The message object
 * @param {CommandClass} command - Command - The command that was executed
 * @param {string[]} args - string[] - The arguments of the command
 * @returns The return value of the function is the return value of the last statement in the function.
 */
async function executeCommand(
  bot: AmethystBot,
  message: Message,
  command: CommandClass,
  args: string[]
) {
  for (let i = 0; i < bot.inhibitors.size; i++) {
    const e = bot.inhibitors.at(i)!;
    const f = await e(bot, command, {
      guildId: message.guildId,
      channelId: message.channelId!,
      memberId: message.authorId,
    });

    if (typeof f != "boolean") {
      return bot.events.commandError?.(bot, {
        message,
        error: f,
      });
    }
  }
  try {
    await command.execute(
      bot,
      await createContext(
        { message },
        createOptionResults(bot, command.args || [], {
          message: { ...message, args },
        }),
        bot
      )
    );
  } catch (e) {
    console.log(e);
    if (bot.events.commandError) {
      bot.events.commandError(bot, {
        message,
        error: { type: ErrorEnums.OTHER },
      });
    } else throw e;
  }
}
/**
 * Handling of incoming messageCommands.
 * @param bot
 * @param message
 * @returns
 */
export async function handleMessageCommands(
  bot: AmethystBot,
  message: Message
) {
  //Get prefix for this guild if the prefix is a function.
  const guildPrefix =
    typeof bot.prefix == "function"
      ? await bot.prefix(bot, message)
      : bot.prefix;

  //Else get the string prefix and check if it works.
  let prefix =
    typeof guildPrefix == "string"
      ? guildPrefix
      : guildPrefix?.find((e) =>
          bot.prefixCaseSensitive
            ? message.content.startsWith(e)
            : message.content.toLowerCase().startsWith(e.toLowerCase())
        );

  //If prefix is a string and not a array
  if (typeof prefix == "string")
    if (bot.prefixCaseSensitive) {
      if (!message.content.startsWith(prefix)) prefix = undefined;
    } else {
      if (!message.content.toLowerCase().startsWith(prefix.toLowerCase()))
        prefix = undefined;
    }

  //If the bot.botMentionAsPrefix is a prefix.
  if (!prefix && bot.botMentionAsPrefix) {
    if (message.content.startsWith(`<@${bot.id}>`)) prefix = `<@${bot.id}>`;
    else if (message.content.startsWith(`<@!${bot.id}>`))
      prefix = `<@!${bot.id}>`;
  }

  if (prefix === undefined) return console.log("Invalid prefix: " + prefix);
  if (
    bot.prefixCaseSensitive
      ? !message.content.startsWith(prefix)
      : !message.content.toLowerCase().startsWith(prefix)
  )
    return;

  let args = message.content.split(" ").filter((e) => Boolean(e.length));
  const commandName = args.shift()?.slice(prefix.length);
  if (!commandName) return;
  const subCommandName = args.shift();
  let command;
  for (let i = 0; i < bot.category.size; i++) {
    command = bot.category.at(i)?.getCommand(commandName, subCommandName);
    if (command) {
      if (bot.category.at(i)?.uniqueCommands && subCommandName)
        args.unshift(subCommandName);
      break;
    }
  }
  if (
    message.member?.user?.toggles.bot &&
    (command?.ignoreBots ?? bot.ignoreBots)
  )
    return;
  if (!command) return bot.events.commandNotFound?.(bot, message, commandName);
  args =
    command.quotedArguments === true ||
    (command.quotedArguments === undefined && bot.messageQuotedArguments)
      ? args
          .join(" ")
          .match(/\w+|"[^"]+"/g)
          ?.map((str) =>
            str.startsWith('"') && str.endsWith('"')
              ? str.replaceAll('"', "")
              : str
          ) || args
      : args;
  ``;
  bot.events.commandStart?.(bot, command, message);
  await executeCommand(bot, message, command, args);
  bot.events.commandEnd?.(bot, command, message);
}
