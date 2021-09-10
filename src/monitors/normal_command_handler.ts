import {
  DiscordenoMessage,
  hasGuildPermissions,
  hasChannelPermissions,
} from "../../deps.ts";
import { CommandClient } from "../classes/mod.ts";
import { Command, CommandContext } from "../types/mod.ts";
import { AmethystError } from "../types/mod.ts";
interface Cooldown {
  used: number;
  timestamp: number;
}

const membersInCooldown = new Map<string, Cooldown>();

async function parseArguments(
  client: CommandClient,
  // deno-lint-ignore no-explicit-any
  ctx: CommandContext<any>,
  // deno-lint-ignore no-explicit-any
  command: Command<any>,
  parameters: string[]
) {
  const args: { [key: string]: unknown } = {};
  if (!command.arguments) return args;

  let missingRequiredArg = false;

  // Clone the parameters so we can modify it without editing original array
  const params = [...parameters];

  // Loop over each argument and validate
  for (const argument of command.arguments) {
    const resolver = client.argumentGenerator.arguments.get(
      argument.type || "string"
    );
    if (!resolver) continue;

    const result = await resolver.execute?.({
      argument,
      parameters: params,
      context: ctx,
    });
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
    } else if (argument.defaultValue)
      args[argument.name] = argument.defaultValue;
    else if (!argument.required) args[argument.name] = undefined;
    // Invalid arg provided.
    else missingRequiredArg = true;
    break;
  }

  // If an arg was missing then return false so we can error out as an object {} will always be truthy
  return missingRequiredArg ? false : args;
}

function handleCooldown(
  client: CommandClient,
  author: bigint,
  // deno-lint-ignore no-explicit-any
  command: Command<any>
) {
  if (
    !command.cooldown ||
    command.ignoreCooldown?.map((e) => BigInt(e)).includes(author) ||
    client.ignoreCooldown?.map((e) => BigInt(e)).includes(author)
  )
    return false;

  const key = `${author}-${command.name}`;
  const cooldown = membersInCooldown.get(key);
  if (cooldown) {
    if (cooldown.used >= (command.cooldown.allowedUses || 1)) {
      const now = Date.now();
      if (cooldown.timestamp > now) {
        return true;
      } else {
        cooldown.used = 0;
      }
    }

    membersInCooldown.set(key, {
      used: cooldown.used + 1,
      timestamp: Date.now() + command.cooldown.seconds * 1000,
    });
    return false;
  }

  membersInCooldown.set(key, {
    used: 1,
    timestamp: Date.now() + command.cooldown.seconds * 1000,
  });
  return false;
}

setInterval(() => {
  const now = Date.now();

  membersInCooldown.forEach((cooldown, key) => {
    if (cooldown.timestamp > now) return;
    membersInCooldown.delete(key);
  });
}, 30000);

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
  const [commandNameWithPrefix] = message.content.split(" ");
  // Returns the prefix directly if it's a string else it executes the function for a custom prefix handler
  if (typeof client.prefix == "string") return client.prefix;
  else if (typeof client.prefix == "object")
    return client.prefix.find((e) => commandNameWithPrefix.startsWith(e));
  else {
    const prefix = await client.prefix(message);
    if (typeof prefix == "object")
      return prefix.find((e) => commandNameWithPrefix.startsWith(e));
    return prefix;
  }
}

async function commandAllowed(
  client: CommandClient,
  // deno-lint-ignore no-explicit-any
  command: Command<any>,
  // deno-lint-ignore no-explicit-any
  ctx: CommandContext<any>
): Promise<true | AmethystError> {
  // Checks for cooldowns
  if (command.cooldown && handleCooldown(client, ctx.message.authorId, command))
    return {
      type: 6,
      context: ctx,
      value: {
        expiresAt: Date.now() + command.cooldown.seconds * 1000,
        executedAt: Date.now(),
      },
    };

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
  if (!prefix) return;
  const [commandName, ...parameters] = message.content
    .substring(prefix.length)
    .split(" ");
  // Fetch the command from the command name
  const command = parseCommand(client, commandName);
  if (!command) return;
  // Create the command context
  // deno-lint-ignore no-explicit-any
  const context: CommandContext<any> = {
    message,
    client,
    guild: message.guild,
  };
  // Parsed args and validated
  const args = await parseArguments(client, context, command, parameters);
  if (!args) return;
  // @ts-ignore -
  context.arguments = args;
  // Go through multiple checks
  const cmdAllow = await commandAllowed(client, command, context);
  if (cmdAllow !== true)
    return client.eventHandlers.commandFail?.(command, cmdAllow);

  client.eventHandlers.commandStart?.(command, context);
  // Execute the command
  await command.execute?.(context);
  client.eventHandlers.commandEnd?.(command, context);
}
