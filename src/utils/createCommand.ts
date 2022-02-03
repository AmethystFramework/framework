import { delay, Collection } from "../../deps.ts";
import { ArgumentDefinition } from "../interfaces/arguments.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import {
  SlashSubcommandGroup,
  SlashSubcommand,
  MessageCommand,
} from "../interfaces/command.ts";

/*Creates a message command*/
export function createMessageCommand<T extends readonly ArgumentDefinition[]>(
  bot: AmethystBot,
  command: MessageCommand<T>
) {
  bot.messageCommands.set(command.name, command);
}

/*Creates a subcommand for a valid message command*/
export function createMessageSubcommand<
  T extends readonly ArgumentDefinition[]
>(
  bot: AmethystBot,
  commandName: string,
  subcommand: Omit<MessageCommand<T>, "category">,
  retries = 0
) {
  const names = commandName.split("-");

  let command = bot.messageCommands.get(commandName)!;

  if (names.length > 1) {
    for (const name of names) {
      const validCommand = command
        ? command.subcommands?.get(name)
        : bot.messageCommands.get(name);

      if (!validCommand) {
        if (retries === 20) break;
        setTimeout(
          () =>
            createMessageSubcommand(bot, commandName, subcommand, retries++),
          10000
        );
        return;
      }

      command = validCommand;
    }
  }

  if (!command) {
    // If 10 minutes have passed something must have been wrong
    if (retries === 20)
      throw `The command with name "${command}" does not exist!`;

    // Try again in 10 seconds in case this command file just has not been loaded yet.
    setTimeout(
      () => createMessageSubcommand(bot, commandName, subcommand, retries++),
      10000
    );
    return;
  }

  if (!command.subcommands) {
    command.subcommands = new Collection();
  }

  // log.debug("Creating subcommand", command.name, subcommand.name);
  command.subcommands.set(subcommand.name, subcommand);
}

/*Creates a slash command*/
export function createSlashCommand(bot: AmethystBot, command: SlashSubcommand) {
  bot.slashCommands.set(command.name, command);
}
/*Creates a subcommand group for a slash command*/
export async function createSlashSubcommandGroup(
  bot: AmethystBot,
  command: string,
  subcommand: SlashSubcommandGroup,
  retries?: number
): Promise<void> {
  const cmd = bot.slashCommands.get(command);
  if (!cmd)
    if (retries == 20)
      throw `The command with name "${command}" does not exist!`;
    else {
      await delay(500);
      return createSlashSubcommandGroup(
        bot,
        command,
        subcommand,
        retries ? retries + 1 : 1
      );
    }
  cmd?.subcommands
    ? cmd.subcommands.set(subcommand.name, subcommand)
    : bot.slashCommands.set(command, {
        ...cmd!,
        subcommands: new Collection([
          [
            subcommand.name,
            subcommand as SlashSubcommandGroup | SlashSubcommand,
          ],
        ]),
      });
}

/*Creates a subcommand for a slash command or slash subcommand group*/
export async function createSlashSubcommand(
  bot: AmethystBot,
  command: string,
  subcommand: SlashSubcommand,
  options?: { split?: boolean; retries?: number }
): Promise<void> {
  options = options ?? {};
  options.split = options.split ?? true;
  const commandNames = command.split("-", 2);
  const cmd = bot.slashCommands.get(options.split ? commandNames[0] : command);
  if (!cmd)
    if (options.retries == 20)
      throw `The command with name "${command}" does not exist!`;
    else {
      await delay(500);
      return createSlashSubcommand(bot, command, subcommand, {
        ...options,
        retries: options.retries ? options.retries + 1 : 1,
      });
    }
  if (options.split && commandNames.length > 1) {
    const subcommandGroup = cmd.subcommands?.get(
      `${commandNames[1]}${command.slice(commandNames.join("-").length)}`
    ) as SlashSubcommandGroup | undefined;
    if (!subcommandGroup)
      return console.error(
        `The subcommand group with name "${`${commandNames[1]}${command.slice(
          commandNames.join("-").length
        )}`}" does not exist!`
      );
    subcommandGroup.subcommands
      ? subcommandGroup.subcommands.set(subcommand.name, {
          ...subcommand,
          SubcommandType: "subcommand",
        })
      : (subcommandGroup.subcommands = new Collection([
          [
            subcommand.name,
            { ...subcommand, SubcommandType: "subcommand" } as SlashSubcommand,
          ],
        ]));
    bot.slashCommands.set(commandNames[0], {
      ...cmd,
      subcommands: new Collection([
        ...(cmd.subcommands?.entries() ?? []),
        [
          subcommandGroup.name,
          { ...subcommandGroup, SubcommandType: "subcommandGroup" } as
            | SlashSubcommandGroup
            | SlashSubcommand,
        ],
      ]),
    });
  } else {
    cmd.subcommands
      ? cmd.subcommands.set(subcommand.name, subcommand)
      : bot.slashCommands.set(command, {
          ...cmd,
          subcommands: new Collection([
            [
              subcommand.name,
              { ...subcommand, SubcommandType: "subcommand" } as
                | SlashSubcommandGroup
                | SlashSubcommand,
            ],
          ]),
        });
  }
}
