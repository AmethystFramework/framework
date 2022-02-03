import {
  BotWithCache,
  MakeRequired,
  EditGlobalApplicationCommand,
  ApplicationCommandOption,
  Collection,
} from "./deps.ts";
import { commandArguments } from "./src/arguments/mod.ts";
import { handleMessageCommands } from "./src/handlers/messageCommands.ts";
import { handleSlash } from "./src/handlers/slashCommands.ts";
import { inhibitors } from "./src/inhibators/mod.ts";
import { AmethystBotOptions } from "./src/interfaces/AmethystBotOptions.ts";
import { AmethystBot } from "./src/interfaces/bot.ts";
import { SlashSubcommand } from "./src/interfaces/command.ts";
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
        try {
          await task.execute();
        } catch (error) {
          throw error;
        }

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
    bot.arguments = new Collection();
    bot.prefix = options.prefix;
  }
  bot.arguments = commandArguments;
  const { ready, interactionCreate, messageCreate } = rawBot.events;
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
    console.log("hi");
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
        description: command.type == 1 ? command.description : undefined,
        type: command.type ?? 1,
        options:
          command.type == 1
            ? ([
                ...(command.options ?? []),
                ...(command.subcommands?.map((cmd) => {
                  if (!cmd.SubcommandType || cmd.SubcommandType == "subcommand")
                    return {
                      name: cmd.name,
                      description: cmd.description,
                      options: (cmd as SlashSubcommand).options,
                      type: 1,
                    };
                  else if (cmd.SubcommandType == "subcommandGroup")
                    return {
                      name: cmd.name,
                      description: cmd.description,
                      type: 2,
                      options: cmd.subcommands?.map((e) => {
                        return {
                          name: e.name,
                          description: e.description,
                          options: e.options,
                          type: 1,
                        };
                      }),
                    };
                }) ?? []),
              ] as ApplicationCommandOption[])
            : undefined,
      };
      if (command.scope === "guild") {
        perGuildCommands.push(slashCmd);
      } else if (command.scope === "global") {
        globalCommands.push(slashCmd);
      }
    }

    await bot.helpers.upsertApplicationCommands(globalCommands);

    perGuildCommands
      .filter((e) => {
        const command = bot.slashCommands.get(e.name);
        return Boolean(command?.scope == "guild" && command?.guildIds?.length);
      })
      .forEach((cmd) => {
        const command = bot.slashCommands.get(cmd.name);
        if (!command || !("guildIds" in command)) return;
        command.guildIds.forEach(async (guildId) => {
          await bot.helpers.upsertApplicationCommands([cmd], guildId);
        });
      });
    payload.guilds.forEach(
      async (guildId) =>
        await bot.helpers.upsertApplicationCommands(
          perGuildCommands.filter((e) => {
            const command = bot.slashCommands.get(e.name);
            return command?.scope == "guild" && !command.guildIds?.length;
          }, guildId)
        )
    );
    Ready = true;
  };
  return bot;
}
