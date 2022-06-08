import {
  BotWithCache,
  Collection,
  Emoji,
  Interaction,
  Message,
} from "./deps.ts";
import { commandArguments } from "./src/arguments/mod.ts";
import { handleMessageCommands } from "./src/handlers/messageCommands.ts";
import { handleSlash } from "./src/handlers/slashCommands.ts";
import { inhibitors } from "./src/inhibators/mod.ts";
import { AmethystBotOptions } from "./src/interfaces/AmethystBotOptions.ts";
import { AmethystBot } from "./src/interfaces/bot.ts";
import { BaseCommand } from "./src/interfaces/command.ts";
import { AmethystError } from "./src/interfaces/errors.ts";
import { AmethystTask } from "./src/interfaces/tasks.ts";
import { AmethystCollection } from "./src/utils/AmethystCollection.ts";
import {
  awaitComponent,
  awaitMessage,
  awaitReaction,
} from "./src/utils/Collectors.ts";
import {
  createMessageCommand,
  createMessageSubcommand,
  createSlashCommand,
  createSlashSubcommand,
  createSlashSubcommandGroup,
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

function handleMessageCollector(bot: AmethystBot, message: Message) {
  const collector = bot.messageCollectors.get(
    `${message.authorId}-${message.channelId}`,
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
function handleReactionCollector(
  bot: AmethystBot,
  payload: {
    messageId: bigint;
    userId: bigint;
    channelId: bigint;
    guildId?: bigint;
    emoji: Emoji;
  },
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
          }, task.interval),
        );
      }, task.interval - (Date.now() % task.interval)),
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
    options?: { memberId?: bigint; guildId?: bigint; channelId: bigint },
  ) => true | AmethystError,
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
  options?: AmethystBotOptions,
) {
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
  bot.tasks = new AmethystCollection([
    [
      "collector",
      {
        name: "collector",
        interval: 600000,
        execute: () => {
          const now = Date.now();
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
  bot.messageCollectors = new AmethystCollection();
  bot.componentCollectors = new AmethystCollection();
  bot.reactionCollectors = new AmethystCollection();
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
  if (bot.guildOnly && bot.dmOnly) {
    throw new Error(
      "You can't have both guild only and dm only options enabled at the same time",
    );
  }
  bot.inhibitors = inhibitors;
  if (options?.prefix) {
    bot.arguments = new AmethystCollection();
    bot.prefix = options.prefix;
  }
  bot.arguments = commandArguments;
  const { ready, interactionCreate, guildCreate, messageCreate, reactionAdd } =
    rawBot.events;
  bot.events.guildCreate = (raw, guild) => {
    guildCreate(raw, guild);
    const bot = raw as AmethystBot;
    bot.slashCommands
      .filter((cmd) => cmd.scope === "guild" && !cmd.guildIds?.length)
      .forEach((cmd) => {
        bot.helpers.upsertApplicationCommands([cmd], guild.id);
      });
  };
  bot.events.messageCreate = (_, msg) => {
    messageCreate(_, msg);
    handleMessageCommands(_ as AmethystBot, msg);
    handleMessageCollector(_ as AmethystBot, msg);
  };
  bot.events.reactionAdd = (_, payload) => {
    reactionAdd(_, payload);
    handleReactionCollector(_ as AmethystBot, payload);
  };
  bot.events.interactionCreate = (_, data) => {
    interactionCreate(_, data);
    handleSlash(_ as AmethystBot, data);
    if (data.type === 3) handleComponentCollector(_ as AmethystBot, data);
  };
  bot.events.ready = async (raw, payload, rawPayload) => {
    await ready(raw, payload, rawPayload);
    if (Ready) return;
    const bot = raw as AmethystBot;
    registerTasks(bot);
    bot.helpers.upsertApplicationCommands(
      bot.slashCommands.filter((e) => !e.scope || e.scope == "global").array(),
    );
    payload.guilds.forEach((guildId) => {
      bot.helpers.upsertApplicationCommands(
        bot.slashCommands.filter((e) =>
          e.scope == "guild" && !e.guildIds?.length
        ).array(),
        guildId,
      );
    });
    bot.slashCommands.forEach((cmd) => {
      if (cmd.scope != "guild" || !cmd.guildIds?.length) return;
      cmd.guildIds.forEach((guildId) =>
        bot.helpers.upsertApplicationCommands([cmd], guildId)
      );
    });
    Ready = true;
  };
  return bot;
}
