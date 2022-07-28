import { Collection, delay } from "../../deps.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { Command, subcommand, subcommandGroup } from "../interfaces/command.ts";

export function createCommand(bot: AmethystBot, command: Command) {
  bot.commands.set(command.name, command);
}

/*Creates a subcommand group*/
export async function createSubcommandGroup(
  bot: AmethystBot,
  command: string,
  subcommand: subcommandGroup,
  retries?: number
): Promise<void> {
  const cmd = bot.commands.get(command);
  if (!cmd) {
    if (retries == 20) {
      throw `The command with name "${command}" does not exist!`;
    } else {
      await delay(500);
      return createSubcommandGroup(
        bot,
        command,
        subcommand,
        retries ? retries + 1 : 1
      );
    }
  }
  /*cmd.options?.push({
    name: subcommand.name,
    description: subcommand.description,
    options: [],
    type: 2,
  } as unknown as ApplicationCommandOption);*/
  cmd?.subcommands
    ? cmd.subcommands.set(subcommand.name, subcommand)
    : bot.commands.set(command, {
        ...cmd!,
        subcommands: new Collection([
          [subcommand.name, subcommand as subcommandGroup | subcommand],
        ]),
      });
}

/*Creates a subcommand for a slash command or slash subcommand group*/
export async function createSubcommand(
  bot: AmethystBot,
  command: string,
  subcommand: subcommand,
  options?: { split?: boolean; retries?: number }
): Promise<void> {
  options = options ?? {};
  options.split = options.split ?? true;
  const commandNames = command.split("-", 2);
  const cmd = bot.commands.get(options.split ? commandNames[0] : command);
  if (!cmd) {
    if (options.retries == 20) {
      throw `The command with name "${command}" does not exist!`;
    } else {
      await delay(500);
      return createSubcommand(bot, command, subcommand, {
        ...options,
        retries: options.retries ? options.retries + 1 : 1,
      });
    }
  }
  if (options.split && commandNames.length > 1) {
    const subcommandGroup = cmd.subcommands?.get(
      `${commandNames[1]}${command.slice(commandNames.join("-").length)}`
    ) as subcommandGroup | undefined;
    if (!subcommandGroup) {
      return console.error(
        `The subcommand group with name "${`${commandNames[1]}${command.slice(
          commandNames.join("-").length
        )}`}" does not exist!`
      );
    }
    subcommandGroup.subcommands
      ? subcommandGroup.subcommands.set(subcommand.name, {
          ...subcommand,
          SubcommandType: "subcommand",
        })
      : (subcommandGroup.subcommands = new Collection([
          [
            subcommand.name,
            { ...subcommand, SubcommandType: "subcommand" } as subcommand,
          ],
        ]));
    /*bot.commands.set(commandNames[0], {
      ...cmd,
      options: [
        ...(cmd.options?.filter((e) => e.name !== subcommandGroup.name) || []),
        {
          name: subcommandGroup.name,
          type: 2,
          description: subcommandGroup.description,
          options: subcommandGroup.subcommands!.map((e) => {
            return {
              name: e.name,
              description: e.description,
              type: 1,
              options: e.options,
            } as ApplicationCommandOption;
          }),
        } as ApplicationCommandOption,
      ],
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
    if (!cmd.options) cmd.options = [];
    cmd.options.push({
      name: subcommand.name,
      description: subcommand.description!,
      type: 1,
      options: subcommand.options,
    } as ApplicationCommandOption);

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
  }*/
  }
}
