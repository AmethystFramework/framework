import { DiscordenoMessage } from "../../deps.ts";
import { CommandClient } from "../classes/CommandClient.ts";
import { Command } from "../types/Command.ts";
import { CommandContext } from "../types/commandContext.ts";

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

function commandAllowed(
  client: CommandClient,
  command: Command,
  ctx: CommandContext
) {
  // Checks if the executor is the owner of the bot
  if (
    command.ownerOnly &&
    client.options.ownerIds &&
    !client.options.ownerIds?.includes(ctx.message.authorId)
  )
    return false;
  return true;
}

export async function executeCommand(
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
  const context: CommandContext = { message, client, guild: message.guild };
  // Go through multiple checks
  if (!commandAllowed(client, command, context)) return;
  client.eventHandlers.commandStart?.(command, context);
  // Execute the command
  await command.execute?.(context);
  client.eventHandlers.commandEnd?.(command, context);
}
