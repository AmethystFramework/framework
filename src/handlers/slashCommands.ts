import { Interaction } from "../../deps.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import {
  SlashCommand,
  SlashSubcommand,
  SlashSubcommandGroup,
} from "../interfaces/command.ts";
import { AmethystError, Errors } from "../interfaces/errors.ts";

interface commandFetch {
  type: "command" | "subcommand" | "subcommandGroup";
  command: SlashCommand | SlashSubcommand;
}

function fetchCommand(
  data: Interaction,
  command: SlashCommand
): commandFetch | undefined {
  if (!command.subcommands?.size) return { type: "command", command };
  const subGroup: SlashSubcommandGroup | undefined = command.subcommands.find(
    (e) =>
      data.data!.options![0]!.type == 2 &&
      e.name == data.data!.options![0]!.name &&
      e.SubcommandType == "subcommandGroup"
  ) as SlashSubcommandGroup | undefined;
  if (subGroup)
    return {
      type: "subcommandGroup",
      command: subGroup.subcommands?.get(
        data.data!.options![0]!.options![0]!.name!
      )!,
    };

  const sub = command.subcommands.get(data.data!.options![0]!.name!) as
    | SlashSubcommand
    | undefined;
  if (sub) return { type: "subcommand", command: sub };
}

export async function handleSlash(bot: AmethystBot, data: Interaction) {
  if (
    data.type !== 2 ||
    !data.data?.name ||
    !bot.slashCommands.has(data.data.name)
  )
    return;
  if (data.guildId && !bot.guilds.has(data.guildId))
    bot.guilds.set(
      data.guildId,
      await bot.helpers.getGuild(data.guildId, { counts: true })
    );
  if (data.guildId && data.member && !bot.members.has(data.user.id))
    bot.members.set(
      bot.transformers.snowflake(`${data.user.id}${data.guildId}`),
      await bot.helpers.getMember(data.guildId, data.user.id)
    );
  if (data.channelId && !bot.channels.has(data.channelId)){
    const channel = await bot.helpers.getChannel(data.channelId)
    if (!channel) throw "There was an issue fetching the command's channel"
    bot.channels.set(
      data.channelId,
      channel
    );}
  const cmd = bot.slashCommands.get(data.data.name)!;
  const command = fetchCommand(data, cmd)!;
  if (
    bot.inhibitors.some(
      (e) =>
        e(bot, command?.command as SlashCommand, {
          guildId: data.guildId,
          channelId: data.channelId!,
          memberId: data.user.id,
        }) !== true
    )
  )
    return bot.events.commandError?.(bot, {
      data,
      error: bot.inhibitors
        .map((e) =>
          e(bot, command?.command as SlashCommand, {
            guildId: data.guildId,
            channelId: data.channelId!,
            memberId: data.user.id,
          })
        )
        .find((e) => typeof e !== "boolean")! as AmethystError,
    });
  try {
    bot.events.commandStart?.(bot, command!.command! as SlashCommand, data);
    command?.command.execute?.(
      bot,
      command.type === "command"
        ? data
        : command.type === "subcommand"
        ? { ...data, data: data.data.options?.[0] }
        : { ...data, data: data.data.options?.[0]?.options?.[0] }
    );
    bot.events.commandEnd?.(bot, command!.command! as SlashCommand, data);
  } catch (e) {
    if (bot.events.commandError)
      bot.events.commandError(bot, {
        error: { type: Errors.OTHER },
        data,
      });
    else throw e;
  }
}
