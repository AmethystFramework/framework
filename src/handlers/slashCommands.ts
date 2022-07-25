import { Interaction } from "../../deps.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { Command, subcommand, subcommandGroup } from "../interfaces/command.ts";
import { AmethystError, Errors } from "../interfaces/errors.ts";
import { createContext } from "../utils/createContext.ts";
import { createOptionResults } from "../utils/createOptionResults.ts";

interface commandFetch {
  type: "command" | "subcommand" | "subcommandGroup";
  command: Command<"application"> | subcommand<"application">;
}

function fetchCommand(
  data: Interaction,
  command: Command<"application">
): commandFetch | undefined {
  if (!command.subcommands?.size) return { type: "command", command };
  const subGroup: subcommandGroup<"application"> | undefined =
    command.subcommands.find(
      (e) =>
        data.data!.options![0]!.type == 2 &&
        e.name == data.data!.options![0]!.name &&
        e.SubcommandType == "subcommandGroup"
    ) as subcommandGroup<"application"> | undefined;
  if (subGroup) {
    return {
      type: "subcommandGroup",
      command: subGroup.subcommands?.get(
        data.data!.options![0]!.options![0]!.name!
      )!,
    };
  }

  const sub = command.subcommands.get(data.data!.options![0]!.name!) as
    | subcommand<"application">
    | undefined;
  if (sub) return { type: "subcommand", command: sub };
}

export async function handleSlash(bot: AmethystBot, data: Interaction) {
  if (
    data.type !== 2 ||
    !data.data?.name ||
    !bot.commands.has(data.data.name)
  ) {
    return;
  }
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
  const cmd = bot.commands.get(data.data.name)!;
  const command = fetchCommand(data, cmd as Command<"application">)!;
  if (
    bot.inhibitors.some(
      (e) =>
        e(bot, command?.command as Command, {
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
          e(bot, command?.command as Command, {
            guildId: data.guildId,
            channelId: data.channelId!,
            memberId: data.user.id,
          })
        )
        .find((e) => typeof e !== "boolean")! as AmethystError,
    });
  }
  try {
    bot.events.commandStart?.(bot, command!.command! as Command, data);
    command?.command.execute?.(bot, {
      ...createContext({
        interaction:
          command.type === "command"
            ? data
            : command.type === "subcommand"
            ? { ...data, data: data.data.options?.[0] }
            : { ...data, data: data.data.options?.[0]?.options?.[0] },
      }),
      options: createOptionResults(bot, command.command.options, {
        interaction: data,
      }),
    });
    bot.events.commandEnd?.(bot, command!.command! as Command, data);
  } catch (e) {
    if (bot.events.commandError) {
      bot.events.commandError(bot, {
        error: { type: Errors.OTHER },
        data,
      });
    } else throw e;
  }
}
