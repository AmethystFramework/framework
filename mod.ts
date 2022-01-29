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

export function clearTasks(bot: AmethystBot) {
  for (const timeout of bot.runningTasks.initialTimeouts) clearTimeout(timeout);
  for (const task of bot.runningTasks.intervals) clearInterval(task);

  bot.tasks = new Collection<string, AmethystTask>();
  bot.runningTasks = { initialTimeouts: [], intervals: [] };
}

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
    ready(raw, payload, rawPayload);
    if (Ready) return;
    const bot = raw as AmethystBot;
    registerTasks(bot);
    console.log(bot.slashCommands);
    const globalCommands: MakeRequired<EditGlobalApplicationCommand, "name">[] =
      bot.slashCommands
        .filter((e) => !e.scope || e.scope == "global")
        .map((e) => {
          return {
            name: e.name,
            description: e.description,
            type: e.type || 1,
            defaultPermission: e.defaultPermission,
            options: [
              ...(e.options || []),
              ...(e.subcommands?.map((e) =>
                e.SubcommandType === "subcommand"
                  ? ({
                      name: e.name,
                      description: e.description,
                      options: e.options,
                      type: 1,
                    } as ApplicationCommandOption)
                  : e.SubcommandType == "subcommandGroup"
                  ? {
                      name: e.name,
                      description: e.description,
                      type: 2,
                      options: e.subcommands!.map((e) => {
                        return {
                          name: e.name,
                          description: e.description,
                          options: e.options,
                          type: 1,
                        };
                      }),
                    }
                  : ({} as unknown as ApplicationCommandOption)
              ) || []),
            ],
          };
        });
    const perGuildCommands: MakeRequired<
      EditGlobalApplicationCommand,
      "name"
    >[] = bot.slashCommands
      .filter((e) => e.scope == "guild")
      .map((e) => {
        return {
          name: e.name,
          description: e.description,
          type: e.type || 1,
          defaultPermission: e.defaultPermission,
          options: [
            ...(e.options || []),
            ...(e.subcommands?.map((e) =>
              e.SubcommandType === "subcommand"
                ? ({
                    name: e.name,
                    description: e.description,
                    options: e.options,
                    type: 1,
                  } as ApplicationCommandOption)
                : e.SubcommandType == "subcommandGroup"
                ? {
                    name: e.name,
                    description: e.description,
                    type: 2,
                    options: e.subcommands!.map((e) => {
                      return {
                        name: e.name,
                        description: e.description,
                        options: e.options,
                        type: 1,
                      };
                    }),
                  }
                : ({} as unknown as ApplicationCommandOption)
            ) || []),
          ],
        };
      });
    await bot.helpers.upsertApplicationCommands(globalCommands).catch((e) => {
      throw e;
    });

    perGuildCommands
      .filter((e) => Boolean(bot.slashCommands.get(e.name)?.guildIds?.length))
      .forEach((cmd) => {
        bot.slashCommands.get(cmd.name)!.guildIds!.forEach(async (guildId) => {
          await bot.helpers.upsertApplicationCommands([cmd], guildId);
        });
      });
    payload.guilds.forEach(
      async (guildId) =>
        await bot.helpers.upsertApplicationCommands(
          perGuildCommands.filter(
            (e) => !bot.slashCommands.get(e.name)?.guildIds?.length,
            guildId
          )
        )
    );
    Ready = true;
  };
  return bot;
}
