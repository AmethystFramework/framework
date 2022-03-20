import {
  BotWithCache,
  MakeRequired,
  EditGlobalApplicationCommand,
  Collection,
  ApplicationCommandOption,
} from "./deps.ts";
import { commandArguments } from "./src/arguments/mod.ts";
import { handleMessageCommands } from "./src/handlers/messageCommands.ts";
import { handleSlash } from "./src/handlers/slashCommands.ts";
import { inhibitors } from "./src/inhibators/mod.ts";
import { AmethystBotOptions } from "./src/interfaces/AmethystBotOptions.ts";
import { AmethystBot } from "./src/interfaces/bot.ts";
import { BaseCommand, SlashSubcommandGroup } from "./src/interfaces/command.ts";
import { AmethystError } from "./src/interfaces/errors.ts";
import { AmethystTask } from "./src/interfaces/tasks.ts";
import { AmethystCollection } from "./src/utils/AmethystCollection.ts";
import {
  createSlashCommand,
  createSlashSubcommandGroup,
  createSlashSubcommand,
  createMessageCommand,
  createMessageSubcommand,
} from "./src/utils/createCommand.ts";

let Ready = false;

export * from "./src/utils/AmethystCollection.ts";
export * from "./src/utils/Embed.ts";
export * from "./src/utils/component.ts";
export * from "./src/utils/createCommand.ts";
export * from "./src/utils/types.ts";
export * from "./src/interfaces/bot.ts";
export * from "./src/interfaces/tasks.ts";
export * from "./src/interfaces/errors.ts";
export * from "./src/interfaces/command.ts";
export * from "./src/interfaces/arguments.ts";
export * from "./src/interfaces/AmethystBotOptions.ts";

/**
 * Adds a task to run in an interval
 */
export function createTask(bot: AmethystBot, task: AmethystTask) {
  bot.tasks.set(task.name, task);
}

function registerTasks(bot: AmethystBot) {
  for (const task of bot.tasks.values()) {
    bot.runningTasks.initialTimeouts.push(
      setTimeout(async () => {
        await task.execute();
        bot.runningTasks.initialTimeouts.push(
          setInterval(async () => {
            if (!Ready) return;
            try {
              await task.execute();
            } catch (error) {
              throw error;
            }
          }, task.interval)
        );
      }, task.interval - (Date.now() % task.interval))
    );
  }
}

/**
 * Clears all running tasks
 */
export function clearTasks(bot: AmethystBot) {
  for (const timeout of bot.runningTasks.initialTimeouts) clearTimeout(timeout);
  for (const task of bot.runningTasks.intervals) clearInterval(task);

  bot.tasks = new Collection<string, AmethystTask>();
  bot.runningTasks = { initialTimeouts: [], intervals: [] };
}

/**Create a custom inhibitor*/
export function createInhibitor<T extends BaseCommand = BaseCommand>(
  bot: AmethystBot,
  name: string,
  inhibitor: (
    bot: AmethystBot,
    command: T,
    options?: { memberId?: bigint; guildId?: bigint; channelId: bigint }
  ) => true | AmethystError
) {
  // @ts-ignore -
  bot.inhibitors.set(name, inhibitor);
}

/**Delete an unwanted inhibitor*/
export function deleteInhibitor(bot: AmethystBot, name: string) {
  bot.inhibitors.delete(name);
}

/**
 * Creates the amethyst bot with all it's features
 */
export function enableAmethystPlugin<B extends BotWithCache = BotWithCache>(
  rawBot: B,
  options?: AmethystBotOptions
) {
  rawBot.enabledPlugins.add("AMETHYST");
  const bot = rawBot as AmethystBot<B>;
  bot.runningTasks = { intervals: [], initialTimeouts: [] };
  bot.utils = {
    ...bot.utils,
    clearTasks: () => {
      clearTasks(bot);
    },
    createTask: (task) => {
      createTask(bot, task);
    },
    createSlashCommand: (command) => {
      createSlashCommand(bot, command);
    },
    createSlashSubcommandGroup: (command, subGroup, retries) => {
      createSlashSubcommandGroup(bot, command, subGroup, retries);
    },
    createSlashSubcommand: (command, sub, options) => {
      createSlashSubcommand(bot, command, sub, options);
    },
    createMessageCommand: (command) => {
      createMessageCommand(bot, command);
    },
    createMessageSubcommand: (commandName, sub, retries) => {
      createMessageSubcommand(bot, commandName, sub, retries);
    },
    createInhibitor: (name, inhibitor) => {
      createInhibitor(bot, name, inhibitor);
    },
    deleteInhibitor: (name) => {
      deleteInhibitor(bot, name);
    },
  };
  bot.tasks = new AmethystCollection();
  bot.slashCommands = new AmethystCollection();
  bot.messageCommands = new AmethystCollection();
  bot.owners = options?.owners?.map((e) =>
    typeof e == "string" ? bot.utils.snowflakeToBigint(e) : e
  );
  bot.botMentionAsPrefix = options?.botMentionAsPrefix;
  bot.defaultCooldown = options?.defaultCooldown;
  bot.ignoreCooldown = options?.ignoreCooldown?.map((e) => BigInt(e));
  bot.guildOnly = options?.guildOnly;
  bot.dmOnly = options?.dmOnly;
  if (bot.guildOnly && bot.dmOnly)
    throw new Error(
      "You can't have both guild only and dm only options enabled at the same time"
    );
  bot.inhibitors = inhibitors;
  if (options?.prefix) {
    bot.arguments = new AmethystCollection();
    bot.prefix = options.prefix;
  }
  bot.arguments = commandArguments;
  const { ready, interactionCreate, guildCreate, messageCreate } =
    rawBot.events;
  bot.events.guildCreate = (raw, guild) => {
    guildCreate(raw, guild);
    const bot = raw as AmethystBot;
    bot.slashCommands
      .filter((cmd) => cmd.scope === "guild" && !cmd.guildIds?.length)
      .forEach((cmd) => {
        bot.helpers.upsertApplicationCommands(
          [
            {
              name: cmd.name,
              type: cmd.type,
              description:
                cmd.type == 1 || cmd.type === undefined
                  ? cmd.description
                  : undefined,
              options:
                cmd.type == 1 || cmd.type === undefined
                  ? [
                      ...(cmd.options || []),
                      ...(cmd.subcommands?.map((sub) =>
                        sub.SubcommandType == "subcommand"
                          ? {
                              name: cmd.name,
                              description: sub.description!,
                              options: cmd.options,
                              required: true,
                              type: 1,
                            }
                          : {
                              name: cmd.name,
                              description: sub.description!,
                              required: true,
                              options: (
                                sub as SlashSubcommandGroup
                              ).subcommands!.map((sub) => {
                                return {
                                  name: sub.name,
                                  description: sub.description!,
                                  options: sub.options,
                                  required: true,
                                  type: 1,
                                };
                              }),
                              type: 2,
                            }
                      ) || []),
                    ]
                  : undefined,
            },
          ],
          guild.id
        );
      });
  };
  bot.events.messageCreate = (_, msg) => {
    messageCreate(_, msg);
    handleMessageCommands(_ as AmethystBot, msg);
  };
  bot.events.interactionCreate = (_, data) => {
    interactionCreate(_, data);
    handleSlash(_ as AmethystBot, data);
  };
  bot.events.ready = async (raw, payload, rawPayload) => {
    await ready(raw, payload, rawPayload);
    if (Ready) return;
    const bot = raw as AmethystBot;
    registerTasks(bot);

    const globalCommands: MakeRequired<EditGlobalApplicationCommand, "name">[] =
      [];
    const perGuildCommands: MakeRequired<
      EditGlobalApplicationCommand,
      "name"
    >[] = [];

    for (const command of bot.slashCommands.values()) {
      const slashCmd = {
        name: command.name,
        type: command.type,
        description:
          command.type === undefined || command.type == 1
            ? command.description
            : undefined,
        options:
          command.type == 1 || command.type === undefined
            ? ([
                ...(command.options || []),
                ...(command.subcommands?.map((sub) =>
                  sub.SubcommandType == "subcommand"
                    ? {
                        name: command.name,
                        description: sub.description!,
                        options: command.options,
                        type: 1,
                      }
                    : {
                        name: command.name,
                        description: sub.description!,
                        options: (sub as SlashSubcommandGroup).subcommands!.map(
                          (sub) => {
                            return {
                              name: sub.name,
                              description: sub.description!,
                              options: sub.options,
                              type: 1,
                            };
                          }
                        ),
                        type: 2,
                      }
                ) || []),
              ] as ApplicationCommandOption[])
            : undefined,
      };
      if (!command.scope || command.scope === "global")
        globalCommands.push(slashCmd);
      else if (command.scope === "guild") perGuildCommands.push(slashCmd);
    }

    await bot.helpers.upsertApplicationCommands(globalCommands);

    perGuildCommands
      .filter((e) => {
        const command = bot.slashCommands.get(e.name);
        return Boolean(command?.scope == "guild" && command?.guildIds?.length);
      })
      .forEach((cmd) => {
        const command = bot.slashCommands.get(cmd.name);
        if (!command || command.scope !== "guild") return;
        command.guildIds?.forEach(async (guildId) => {
          await bot.helpers.upsertApplicationCommands([cmd], guildId);
        });
      });
    payload.guilds.forEach(
      async (guildId) =>
        await bot.helpers.upsertApplicationCommands(
          perGuildCommands.filter((e) => {
            const command = bot.slashCommands.get(e.name);
            return command?.scope == "guild" && !command.guildIds?.length;
          }),
          guildId
        )
    );
    Ready = true;
  };
  return bot;
}
