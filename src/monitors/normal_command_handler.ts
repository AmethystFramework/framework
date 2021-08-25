import {
  DiscordenoMessage,
  hasGuildPermissions,
  hasChannelPermissions,
} from "../../deps.ts";
import { CommandClient } from "../classes/mod.ts";
import { Command, CommandContext } from "../types/mod.ts";
import { AmethystError } from "../types/mod.ts";

function parseCommand(client: CommandClient, commandName: string) {
  const command = client.commands.get(commandName);
  if (command) return command;

  // Checks if the command name is an alias
  return client.commands.find((cmd) =>
    Boolean(cmd.aliases?.includes(commandName))
  );
}

export async function ParsePrefix(
  client: CommandClient,
  message: DiscordenoMessage
) {
  // Returns the prefix directly if it's a string else it executes the function for a custom prefix handler
  if (typeof client.prefix == "string") return client.prefix;
  else return await client.prefix(message);
}

async function commandAllowed(
  client: CommandClient,
  command: Command,
  ctx: CommandContext
): Promise<true | AmethystError> {
  // Checks if the executor is the owner of the bot
  if (
    command.ownerOnly &&
    client.options.ownerIds &&
    !client.options.ownerIds?.includes(ctx.message.authorId)
  )
    return { type: 0, context: ctx };

  // DM channels aren't nsfw
  if (
    command.nsfw &&
    ctx.guild?.nsfwLevel !== 3 &&
    (!ctx.guild || ctx.message.channel?.type === 1 || ctx.message.channel?.nsfw)
  )
    return { type: 1, context: ctx };

  // Checks if the command is DMs only
  if (
    (command.dmOnly || client.dmsOnly) &&
    (ctx.guild || ctx.message.channel?.type !== 1)
  )
    return { type: 2, context: ctx };

  // Checks if the command is guilds only
  if (
    (command.guildOnly || client.guildsOnly) &&
    (!ctx.guild || ctx.message.channel?.type === 1)
  )
    return { type: 3, context: ctx };

  if (
    command.userServerPermissions?.length &&
    ctx.guild &&
    !(await hasGuildPermissions(
      ctx.guild.id,
      ctx.message.authorId,
      command.userServerPermissions
    ))
  )
    return {
      type: 4,
      context: ctx,
      channel: false,
      value: command.userServerPermissions,
    };

  if (
    command.userChannelPermissions?.length &&
    ctx.guild &&
    !(await hasChannelPermissions(
      ctx.guild.id,
      ctx.message.authorId,
      command.userChannelPermissions
    ))
  )
    return {
      type: 4,
      context: ctx,
      channel: true,
      value: command.userChannelPermissions,
    };

  if (
    command.botServerPermissions?.length &&
    ctx.guild &&
    !(await hasGuildPermissions(
      ctx.guild.id,
      ctx.message.authorId,
      command.botServerPermissions
    ))
  )
    return {
      type: 5,
      context: ctx,
      channel: false,
      value: command.botServerPermissions,
    };

  if (
    command.botChannelPermissions?.length &&
    ctx.guild &&
    !(await hasChannelPermissions(
      ctx.guild.id,
      ctx.message.authorId,
      command.botChannelPermissions
    ))
  )
    return {
      type: 5,
      context: ctx,
      channel: true,
      value: command.botChannelPermissions,
    };
  return true;
}

export async function executeNormalCommand(
  client: CommandClient,
  message: DiscordenoMessage
) {
  // Fetch the prefix
  const prefix = await ParsePrefix(client, message);
  const [commandName] = message.content.substring(prefix.length).split(" ");
  // Fetch the command from the command name
  const command = parseCommand(client, commandName);
  if (!command) return;
  // Create the command context
  const context: CommandContext = {
    message,
    client,
    guild: message.guild,
  };
  // Go through multiple checks
  const cmdAllow = await commandAllowed(client, command, context);
  if (cmdAllow !== true)
    return client.eventHandlers.commandFail?.(command, cmdAllow);

  client.eventHandlers.commandStart?.(command, context);
  // Execute the command
  await command.execute?.(context);
  client.eventHandlers.commandEnd?.(command, context);
}
