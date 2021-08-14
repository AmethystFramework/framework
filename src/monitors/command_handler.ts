import { DiscordenoMessage } from "../../deps.ts";
import { CommandClient } from "../classes/CommandClient.ts";
import { Command } from "../types/Command.ts";
import { CommandContext } from "../types/commandContext.ts";

function parseCommand(client: CommandClient, commandName: string) {
  const command = client.commands.get(commandName);
  if (command) return command;

  return client.commands.find((cmd) =>
    Boolean(cmd.aliases?.includes(commandName))
  );
}

export async function ParsePrefix(
  client: CommandClient,
  message: DiscordenoMessage
) {
  if (typeof client.prefix == "string") return client.prefix;
  else return await client.prefix(message);
}

function commandAllowed(
  client: CommandClient,
  command: Command,
  ctx: CommandContext
) {
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
  const prefix = await ParsePrefix(client, message);
  const [commandName] = message.content.substring(prefix.length).split(" ");
  const command = parseCommand(client, commandName);
  if (!command) return;
  const context: CommandContext = { message, client, guild: message.guild };
  if (!commandAllowed(client, command, context)) return;
  client.eventHandlers.commandStart?.(command, context);
  await command.execute?.(context);
  client.eventHandlers.commandEnd?.(command, context);
}
