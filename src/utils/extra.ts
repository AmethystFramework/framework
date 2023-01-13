import { Bot, Emoji, Interaction, Message } from '../../deps.ts';
import { BotWithProxyCache, ProxyCacheTypes } from '../cache-with-proxy/mod.ts';
import { cache } from '../cache.ts';
import { AmethystEventHandler } from '../classes/AmethystEvents.ts';
import CategoryClass from '../classes/Category.ts';
import { CommandClass } from '../classes/Command.ts';
import { Context } from '../classes/Context.ts';
import { handleMessageCommands } from '../handlers/messageCommands.ts';
import { handleSlash } from '../handlers/slashCommands.ts';
import { inhibitors } from '../inhibators/mod.ts';
import { AmethystBotOptions } from '../interfaces/AmethystBotOptions.ts';
import { AmethystBot } from '../interfaces/bot.ts';
import { AmethystError } from '../interfaces/errors.ts';
import { AmethystTask } from '../interfaces/tasks.ts';
import { AmethystCollection } from '../utils/AmethystCollection.ts';
import { awaitComponent, awaitMessage, awaitReaction } from '../utils/Collectors.ts';
import { loadCommands, loadEvents, loadInhibitors } from '../utils/fileLoader.ts';

let Ready = false;
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
export function createInhibitor<T extends CommandClass = CommandClass>(
  bot: AmethystBot,
  name: string,
  inhibitor: (
    bot: AmethystBot,
    command: T,
    options?: Context,
  ) => Promise<true | AmethystError>
) {
  // @ts-ignore -
  bot.inhibitors.set(name, inhibitor);
}

/**Delete an unwanted inhibitor*/
export function deleteInhibitor(bot: AmethystBot, name: string) {
  bot.inhibitors.delete(name);
}

/**
 * It takes a bot and returns a bot with the Amethyst plugin enabled.
 * @param {B} rawBot - The bot object that you're using.
 * @param {AmethystBotOptions} [options] - AmethystBotOptions
 */
export function enableAmethystPlugin(
  rawBot: BotWithProxyCache<ProxyCacheTypes, Bot>,
  options?: AmethystBotOptions
) {
  rawBot.enabledPlugins.add("AMETHYST");
  const bot = rawBot as unknown as AmethystBot;
  bot.eventHandler = new AmethystEventHandler(bot);
  bot.runningTasks = { intervals: [], initialTimeouts: [] };
  bot.amethystUtils = {
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
    createCommand: (commandOptions) => {
      const command = new CommandClass(commandOptions, bot);
      if (bot.category!.get(command.category))
        bot
          .category!.get(command.category)
          ?.commands.set(command.name, command);
      else {
        const category = new CategoryClass({
          name: command.category,
          description: "No Information available",
          uniqueCommands: true,
          default: "",
        });

        bot.category!.set(command.category, category);
        category.commands.set(command.name, command);
      }
    },
    createCategory: (categoryOptions) => {
      if (bot.category!.get(categoryOptions.name)) {
        bot.amethystUtils.updateCategory(categoryOptions);
      } else {
        const category = new CategoryClass(categoryOptions);
        bot.category!.set(category.name, category);
      }
    },
    updateCategory: (categoryOptions) => {
      if (bot.category!.get(categoryOptions.name)) {
        bot.category!.get(categoryOptions.name)?.update(categoryOptions);
      } else {
        bot.amethystUtils.createCategory(categoryOptions);
      }
    },
    updateSlashCommands: () => {
      const commands = bot.category!.map((category) => {
        return category.toApplicationCommand();
      });
      bot.helpers.upsertGlobalApplicationCommands(commands);
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
  bot.category = new AmethystCollection();
  bot.owners = options?.owners?.map((e) =>
    typeof e == "string" ? bot.utils.snowflakeToBigint(e) : e
  );
  bot.botMentionAsPrefix = options?.botMentionAsPrefix;
  bot.defaultCooldown = options?.defaultCooldown;
  bot.ignoreCooldown = options?.ignoreCooldown?.map((e) => BigInt(e));
  bot.guildOnly = options?.guildOnly;
  bot.dmOnly = options?.dmOnly;
  bot.extras = options?.extras ?? {};
  if (bot.guildOnly && bot.dmOnly) {
    throw new Error(
      "You can't have both guild only and dm only options enabled at the same time"
    );
  }
  bot.inhibitors = inhibitors;
  bot.on = (name: string, callback: (...args: any[]) => unknown) => {
    bot.eventHandler.on(name, callback);
  };
  bot.once = (name: string, callback: (...args: any[]) => unknown) => {
    bot.eventHandler.on(name, callback);
  };
  bot.emit = (name: string, ...args: any[]) => {
    bot.eventHandler.dispatch(name, ...args);
  };

  cache.set(cache.size, bot);

  if (options?.prefix) bot.prefix = options.prefix;

  (async () => {
    if (options?.eventDir) await loadEvents(bot, options.eventDir);
    if (options?.commandDir) await loadCommands(bot, options.commandDir);
    if (options?.inhibitorDir) await loadInhibitors(bot, options.inhibitorDir);

    bot.on("messageCreate", (_, msg) => {
      const amethystBot = bot as AmethystBot;
      handleMessageCommands(amethystBot, msg);
      handleMessageCollector(amethystBot, msg);
    });
    bot.on("reactionAdd", (_, payload) => {
      const amethystBot = bot as AmethystBot;
      handleReactionCollector(amethystBot, payload);
    });
    bot.on("interactionCreate", (_, data) => {
      const amethystBot = bot as AmethystBot;
      handleSlash(amethystBot, data);
      if (data.type === 3) handleComponentCollector(amethystBot, data);
    });
    bot.on("ready", async (bot, payload, rawPayload) => {
      const amethystBot = bot as AmethystBot;
      amethystBot.user = await amethystBot.helpers.getUser(amethystBot.id);
      registerTasks(amethystBot);
      try {
        const commands =
          await amethystBot.helpers.upsertGlobalApplicationCommands(
            amethystBot.category!.map((category) => {
              return category.toApplicationCommand();
            })
          );
        commands.forEach((command) => {
          const category = amethystBot.category.get(command.name);
          command.options?.forEach((option) => {
            const c = category?.commands.get(option.name);
            c!.mention = `</${option.name}:${command.id}>`;
          });
        });
      } catch (e) {
        console.log(e);
      }
      Ready = true;
    });
  })();
  return bot;
}
