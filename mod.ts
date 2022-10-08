import {
  ApplicationCommandOptionTypes,
  BotWithCache,
  ChannelTypes,
  Emoji,
  Interaction,
  Message,
} from "./deps.ts";
import { handleMessageCommands } from "./src/handlers/messageCommands.ts";
import { handleSlash } from "./src/handlers/slashCommands.ts";
import { inhibitors } from "./src/inhibators/mod.ts";
import { AmethystBotOptions } from "./src/interfaces/AmethystBotOptions.ts";
import { AmethystBot } from "./src/interfaces/bot.ts";
import { Command } from "./src/interfaces/command.ts";
import { AmethystError } from "./src/interfaces/errors.ts";
import { AmethystTask } from "./src/interfaces/tasks.ts";
import { AmethystCollection } from "./src/utils/AmethystCollection.ts";
import {
  awaitComponent,
  awaitMessage,
  awaitReaction,
} from "./src/utils/Collectors.ts";
import {
  createCommand,
  createSubcommand,
  createSubcommandGroup,
} from "./src/utils/createCommand.ts";
import {
  loadCommands,
  loadEvents,
  loadInhibitors,
} from "./src/utils/fileLoader.ts";

let Ready = false;

export * from "./src/interfaces/AmethystBotOptions.ts";
export * from "./src/interfaces/bot.ts";
export * from "./src/interfaces/command.ts";
export * from "./src/interfaces/commandOptions.ts";
export * from "./src/interfaces/context.ts";
export * from "./src/interfaces/errors.ts";
export * from "./src/interfaces/event.ts";
export * from "./src/interfaces/tasks.ts";
export * from "./src/utils/AmethystCollection.ts";
export * from "./src/utils/component.ts";
export * from "./src/utils/createCommand.ts";
export * from "./src/utils/Embed.ts";
export * from "./src/utils/types.ts";

/**
 * Create a task.
 *
 * @param bot The bot instance.
 * @param task The task to create.
 */
export function createTask(bot: AmethystBot, task: AmethystTask) {
  bot.tasks.set(task.name, task);
}

/**
 * Handles a message collector.
 * @param {AmethystBot} bot The bot instance.
 * @param {Message} message The message to handle.
 */
function handleMessageCollector(bot: AmethystBot, message: Message) {
  const collector = bot.messageCollectors.get(
    `${message.authorId}-${message.channelId}`
  );
  // This user has no collectors pending or the message is in a different channel
  if (!collector || message.channelId !== collector.channelId) return;
  // This message is a response to a collector. Now running the filter function.
  if (!collector.filter(bot, message)) return;

  // If the necessary amount has been collected
  if (
    collector.maxUsage === 1 ||
    collector.maxUsage === collector.messages.length + 1
  ) {
    // Remove the collector
    bot.messageCollectors.delete(`${message.authorId}-${message.channelId}`);
    // Resolve the collector
    return collector.resolve([...collector.messages, message]);
  }

  // More messages still need to be collected
  collector.messages.push(message);
}
/**
 * Handles a reaction collector.
 * @param bot The bot instance.
 * @param payload The payload.
 */
function handleReactionCollector(
  bot: AmethystBot,
  payload: {
    messageId: bigint;
    userId: bigint;
    channelId: bigint;
    guildId?: bigint;
    emoji: Emoji;
  }
) {
  const collector = bot.reactionCollectors.get(payload.messageId);
  if (!collector || !payload.emoji.name || !payload.emoji.id) return;
  if (!collector.filter(bot, payload)) return;

  if (
    collector.maxUsage === 1 ||
    collector.maxUsage === collector.reactions.length + 1
  ) {
    bot.componentCollectors.delete(collector.key);
    return collector.resolve([
      ...collector.reactions,
      {
        name: payload.emoji.name,
        id: payload.emoji.id,
        userId: payload.userId,
        channelId: payload.channelId,
        messageId: payload.messageId,
        guildId: payload.guildId,
      },
    ]);
  }

  collector.reactions.push({
    userId: payload.userId,
    channelId: payload.channelId,
    messageId: payload.messageId,
    guildId: payload.guildId,
    name: payload.emoji.name,
    id: payload.emoji.id,
  });
}
/**
 * Handles a component collector.
 * @param bot The bot instance.
 * @param data The interaction data.
 */
function handleComponentCollector(bot: AmethystBot, data: Interaction) {
  const collector = bot.componentCollectors.get(data.message?.id || 0n);
  if (!collector) return;
  if (!collector.filter(bot, data)) return;

  if (
    collector.maxUsage === 1 ||
    collector.maxUsage === collector.components.length + 1
  ) {
    bot.componentCollectors.delete(collector.key);
    return collector.resolve([...collector.components, data]);
  }

  collector.components.push(data);
}

/**
 * Registers all tasks in the bot.
 * @param bot The bot to register the tasks for.
 */
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

  bot.tasks = new AmethystCollection<string, AmethystTask>();
  bot.runningTasks = { initialTimeouts: [], intervals: [] };
}

/**Create a custom inhibitor*/
export function createInhibitor<T extends Command = Command>(
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
export function enableAmethystPlugin<
  B extends Omit<BotWithCache, "events"> = Omit<BotWithCache, "events">
>(rawBot: B, options?: AmethystBotOptions) {
  rawBot.enabledPlugins.add("AMETHYST");
  const bot = rawBot as AmethystBot<B>;
  bot.runningTasks = { intervals: [], initialTimeouts: [] };
  bot.utils = {
    ...bot.utils,
    //@ts-ignore -
    awaitMessage: (memberId, channelId, options) => {
      return awaitMessage(bot, memberId, channelId, options);
    },
    //@ts-ignore -
    awaitReaction: (messageId, options) => {
      return awaitReaction(bot, messageId, options);
    },
    //@ts-ignore -
    awaitComponent: (messageId, options) => {
      return awaitComponent(bot, messageId, options);
    },
    clearTasks: () => {
      clearTasks(bot);
    },
    createTask: (task) => {
      createTask(bot, task);
    },
    createCommand: (command) => {
      createCommand(bot, command);
    },
    createSubcommandGroup: (command, subGroup, retries) => {
      createSubcommandGroup(bot, command, subGroup, retries);
    },
    createSubcommand: (command, sub, options) => {
      createSubcommand(bot, command, sub, options);
    },
    createInhibitor: (name, inhibitor) => {
      createInhibitor(bot, name, inhibitor);
    },
    deleteInhibitor: (name) => {
      deleteInhibitor(bot, name);
    },
  };
  bot.tasks = new AmethystCollection([
    [
      "collector",
      {
        name: "collector",
        interval: 600000,
        execute: () => {
          const now = Date.now();
          bot.componentCollectors.forEach((collector, key) => {
            // This collector has not finished yet.
            if (collector.createdAt + collector.timeout > now) return;

            // Remove the collector
            bot.componentCollectors.delete(key);
            // Reject the promise so code can continue in commands.
            return collector.reject("User did not use the component in time.");
          });
          bot.reactionCollectors.forEach((collector, key) => {
            // This collector has not finished yet.
            if (collector.createdAt + collector.timeout > now) return;

            // Remove the collector
            bot.reactionCollectors.delete(key);
            // Reject the promise so code can continue in commands.
            return collector.reject("User did not react in time.");
          });

          bot.messageCollectors.forEach((collector, key) => {
            // This collector has not finished yet.
            if (collector.createdAt + collector.timeout > now) return;

            // Remove the collector
            bot.messageCollectors.delete(key);
            // Reject the promise so code can continue in commands.
            return collector.reject("User did not send a message in time.");
          });
        },
      },
    ],
  ]);
  bot.ignoreBots = options?.ignoreBots ?? true;
  bot.messageQuotedArguments = options?.messageQuotedArguments ?? false;
  bot.messageCollectors = new AmethystCollection();
  bot.componentCollectors = new AmethystCollection();
  bot.reactionCollectors = new AmethystCollection();
  bot.commands = new AmethystCollection();
  bot.owners = options?.owners?.map((e) =>
    typeof e == "string" ? bot.utils.snowflakeToBigint(e) : e
  );
  bot.botMentionAsPrefix = options?.botMentionAsPrefix;
  bot.defaultCooldown = options?.defaultCooldown;
  bot.ignoreCooldown = options?.ignoreCooldown?.map((e) => BigInt(e));
  bot.guildOnly = options?.guildOnly;
  bot.dmOnly = options?.dmOnly;
  if (bot.guildOnly && bot.dmOnly) {
    throw new Error(
      "You can't have both guild only and dm only options enabled at the same time"
    );
  }
  bot.inhibitors = inhibitors;
  if (options?.prefix) bot.prefix = options.prefix;

  (async () => {
    if (options?.eventDir) await loadEvents(bot, options.eventDir);
    if (options?.commandDir) await loadCommands(bot, options.commandDir);
    if (options?.inhibitorDir) await loadInhibitors(bot, options.inhibitorDir);
    const {
      ready,
      interactionCreate,
      guildCreate,
      messageCreate,
      reactionAdd,
    } = bot.events;
    bot.events.guildCreate = (bot, guild) => {
      guildCreate(bot, guild);
      const amethystBot = bot as AmethystBot;
      amethystBot.commands
        .filter((cmd) => {
          const command = cmd as Command<"application">;
          return (
            Boolean(
              !cmd.commandType ||
                (command.commandType as string[])?.includes("application")
            ) &&
            command.scope === "guild" &&
            !command.guildIds?.length
          );
        })
        .forEach((cmd) => {
          bot.helpers.upsertGuildApplicationCommands(guild.id, [
            {
              ...(cmd as Command<"application">),
              options: cmd.options?.length
                ? cmd.options.map((e) => {
                    return {
                      ...e,
                      description: e.description ?? "A slash command option",
                      channelTypes: e.channelTypes?.map((f) =>
                        typeof f == "string" ? ChannelTypes[f] : f
                      ),
                      type:
                        typeof e.type == "number"
                          ? e.type
                          : ApplicationCommandOptionTypes[
                              e.type as keyof typeof ApplicationCommandOptionTypes
                            ],
                    };
                  })
                : [],
            },
          ]);
        });
    };
    bot.events.messageCreate = (_, msg) => {
      messageCreate(_, msg);
      const amethystBot = bot as AmethystBot;
      handleMessageCommands(amethystBot, msg);
      handleMessageCollector(amethystBot, msg);
    };
    bot.events.reactionAdd = (_, payload) => {
      reactionAdd(_, payload);
      const amethystBot = bot as AmethystBot;
      handleReactionCollector(amethystBot, payload);
    };
    bot.events.interactionCreate = (_, data) => {
      interactionCreate(_, data);
      const amethystBot = bot as AmethystBot;
      handleSlash(amethystBot, data);
      if (data.type === 3) handleComponentCollector(amethystBot, data);
    };
    bot.events.ready = (bot, payload, rawPayload) => {
      ready(bot, payload, rawPayload);
      if (Ready) return;
      const amethystBot = bot as AmethystBot;
      registerTasks(amethystBot);
      bot.helpers.upsertGlobalApplicationCommands(
        amethystBot.commands
          .filter(
            //@ts-ignore -
            (e: Command<"application">) => !e.scope || e.scope == "global"
          )
          .map((cmd) => {
            return {
              ...(cmd as Command<"application">),
              options: cmd.options?.length
                ? cmd.options.map((e) => {
                    return {
                      ...e,
                      description: e.description ?? "A slash command option",
                      channelTypes: e.channelTypes?.map((f) =>
                        typeof f == "string" ? ChannelTypes[f] : f
                      ),
                      type:
                        typeof e.type == "number"
                          ? e.type
                          : ApplicationCommandOptionTypes[
                              e.type as keyof typeof ApplicationCommandOptionTypes
                            ],
                    };
                  })
                : [],
            };
          })
      );
      payload.guilds.forEach((guildId) => {
        amethystBot.helpers.upsertGuildApplicationCommands(
          guildId,
          amethystBot.commands
            .filter(
              //@ts-ignore -
              (e: Command<"application">) =>
                e.scope == "guild" && !e.guildIds?.length
            )
            .map((cmd) => {
              return {
                ...(cmd as Command<"application">),
                options: cmd.options?.length
                  ? cmd.options.map((e) => {
                      return {
                        ...e,
                        description: e.description ?? "A slash command option",
                        channelTypes: e.channelTypes?.map((f) =>
                          typeof f == "string" ? ChannelTypes[f] : f
                        ),
                        type:
                          typeof e.type == "number"
                            ? e.type
                            : ApplicationCommandOptionTypes[
                                e.type as keyof typeof ApplicationCommandOptionTypes
                              ],
                      };
                    })
                  : [],
              };
            })
        );
      });
      //@ts-ignore -
      amethystBot.commands.forEach((cmd: Command<"application">) => {
        if (cmd.scope != "guild" || !cmd.guildIds?.length) return;
        cmd.guildIds.forEach((guildId) =>
          amethystBot.helpers.upsertGuildApplicationCommands(guildId, [
            {
              ...(cmd as Command<"application">),
              options: cmd.options?.length
                ? cmd.options.map((e) => {
                    return {
                      ...e,
                      description: e.description ?? "A slash command option",
                      channelTypes: e.channelTypes?.map((f) =>
                        typeof f == "string" ? ChannelTypes[f] : f
                      ),
                      type:
                        typeof e.type == "number"
                          ? e.type
                          : ApplicationCommandOptionTypes[
                              e.type as keyof typeof ApplicationCommandOptionTypes
                            ],
                    };
                  })
                : [],
            },
          ])
        );
      });
      Ready = true;
    };
  })();
  return bot;
}
