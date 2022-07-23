import { Message } from "../../deps.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { Command } from "../interfaces/command.ts";
import {
  //AmethystError,
  Errors,
  //MissingRequiredArguments,
} from "../interfaces/errors.ts";
import { createContext } from "../utils/createContext.ts";

/*async function parseArguments(
  bot: AmethystBot,
  message: Message,
  // deno-lint-ignore no-explicit-any
  command: BaseCommand<"message">,
  parameters: string[],
) {
  const args: { [key: string]: unknown } = {};
  if (!command?.arguments) return args;

  let missingRequiredArg = false;

  // Clone the parameters so we can modify it without editing original array
  const params = [...parameters];

  const missedRequiredArgs = [];

  // Loop over each argument and validate
  for (const argument of command.arguments) {
    const resolver = bot.arguments?.get(argument.type || "string");
    if (!resolver) continue;

    const result = await resolver.execute(
      bot,
      argument,
      params,
      message,
      command,
    );
    if (result !== undefined) {
      // Assign the valid argument
      args[argument.name] = result;
      // This will use up all args so immediately exist the loop.
      if (
        argument.type &&
        [
          "subcommands",
          "...strings",
          "...roles",
          "...emojis",
          "...snowflakes",
        ].includes(argument.type)
      ) {
        break;
      }
      // Remove a param for the next argument
      params.shift();
      continue;
    }

    // Invalid arg provided.
    if (Object.prototype.hasOwnProperty.call(argument, "defaultValue")) {
      args[argument.name] = argument.defaultValue;
    } else if (argument.required !== false) {
      if (argument.missing) {
        missingRequiredArg = true;
        argument.missing?.(bot, message);
        break;
      }

      missedRequiredArgs.push(argument.name);
      missingRequiredArg = true;
      argument.missing?.(bot, message);
      break;
    }
  }

  // If an arg was missing then return false so we can error out as an object {} will always be truthy
  return missingRequiredArg
    ? ({
      type: Errors.MISSING_REQUIRED_ARGUMENTS,
      value: missedRequiredArgs[0],
    } as MissingRequiredArguments)
    : args;
}*/

/**
 * Execute a message command.
 * @param bot
 * @param message
 * @param command
 */
function executeCommand(
  bot: AmethystBot,
  message: Message,
  command: Command<"message">
  //  args: string[],
) {
  /*const Args = await parseArguments(bot, message, command, args);
  if (Args.value) {
    return bot.events.commandError?.(bot, {
      message,
      error: Args as unknown as AmethystError,
    });
  }*/
  //const [argument] =
  //command.arguments?.filter((e: any) => e.type == "subcommand") || [];
  /*const subcommand = argument
    ? ((Args as { [key: string]: unknown })[
      argument.name
      // deno-lint-ignore no-explicit-any
    ] as MessageCommand<any>)
    : undefined;*/
  try {
    /*if (!argument || argument.type !== "subcommand" || !subcommand) {
      if (
        bot.inhibitors.some(
          (e) =>
            e(bot, command, {
              channelId: message.channelId,
              guildId: message.guildId,
              memberId: message.authorId,
            }) !== true,
        )
      ) {
        return bot.events.commandError?.(bot, {
          message,
          error: bot.inhibitors
            .map((e) =>
              e(bot, command, {
                channelId: message.channelId,
                guildId: message.guildId,
                memberId: message.authorId,
              })
            )
            .find((e) => typeof e !== "boolean")! as AmethystError,
        });
      }*/
    // @ts-ignore -
    command.execute?.(bot, createContext({ message }));
    /*} else if (
      ![subcommand?.name, ...(subcommand?.aliases || [])].includes(args[0])
    ) {
      executeCommand(bot, message, subcommand!, args);
    } else {
      const subArgs = args.slice(1);
      executeCommand(bot, message, subcommand!, subArgs);
    }*/
  } catch (e) {
    if (bot.events.commandError) {
      bot.events.commandError(bot, {
        message,
        error: { type: Errors.OTHER },
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
  //Get prefix for this guild.
  const guildPrefix =
    typeof bot.prefix == "function"
      ? await bot.prefix(bot, message)
      : bot.prefix;

  //
  let prefix =
    typeof guildPrefix == "string"
      ? guildPrefix
      : guildPrefix?.find((e) => message.content.toLowerCase().startsWith(e));
  if (!prefix && bot.botMentionAsPrefix) {
    if (message.content.toLowerCase().startsWith(`<@${bot.id}>`))
      prefix = `<@${bot.id}>`;
    else if (message.content.toLowerCase().startsWith(`<@!${bot.id}>`))
      prefix = `<@!${bot.id}>`;
  }

  if (
    !prefix ||
    (typeof bot.prefix == "string" &&
      !message.content.toLowerCase().startsWith(prefix))
  ) {
    return;
  }

  const args = message.content.split(" ").filter((e) => Boolean(e.length));
  const commandName = args.shift()?.slice(prefix.length);
  const command = bot.commands.find((cmd) =>
    Boolean(cmd.name == commandName /*|| cmd.aliases?.includes(commandName!)*/)
  );

  if (!command)
    return bot.events.commandNotFound?.(
      bot,
      message,
      commandName,
      message.prefix
    );
  if (message.guildId && !bot.members.has(message.authorId)) {
    bot.members.set(
      bot.transformers.snowflake(`${message.guildId}${message.guildId}`),
      message.member ??
        (await bot.helpers.getMember(message.guildId, message.authorId))
    );
  }
  if (message.guildId && !bot.guilds.has(message.guildId)) {
    const guild = await bot.helpers.getGuild(message.guildId, { counts: true });
    if (!guild) throw "there was an issue fetching the guild.";
    bot.guilds.set(message.guildId, guild);
  }
  if (!bot.channels.has(message.channelId)) {
    const channel = await bot.helpers.getChannel(message.channelId);
    if (!channel) throw "There was an issue fetching the message channel";
    bot.channels.set(message.channelId, channel);
  }
  bot.events.commandStart?.(bot, command, message);
  executeCommand(bot, message, command);
  bot.events.commandEnd?.(bot, command, message);
}
