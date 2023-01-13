import { CreateApplicationCommand } from '../../deps.ts';
import { AmethystCollection, CommandClass } from '../../mod.ts';
import { CategoryOptions } from '../types/categoryOptions.ts';
import { validateRequiredParameters } from './Validations.ts';

/* Exporting the class Category. */
export default class CategoryClass {
  /* Name of the category */
  name: string;
  /* Information about the category */
  description: string;
  /* Treat each command as a subcommand or a command on its own. */
  uniqueCommands: boolean;
  /* Default command when uniqueCommand is false. */
  default: string;
  /* Commands belonging to this category */
  commands: AmethystCollection<string, CommandClass>;

  /**
   * It's a constructor for the Category class
   * @param {CategoryOptions} options - CategoryOptions
   */
  constructor(options: CategoryOptions) {
    this.name = options.name;
    this.description = options.description;
    this.uniqueCommands = options.uniqueCommands;
    this.default = options.default;
    this.commands = new AmethystCollection();
    validateRequiredParameters(this.name, this.description, []);
  }

  /**
   * It takes an object with the same properties as the class, and updates the class with the values of
   * the object
   * @param {CategoryOptions} options - CategoryOptions
   */
  update(options: CategoryOptions) {
    this.name = options.name;
    this.description = options.description;
    this.uniqueCommands = options.uniqueCommands;
    this.default = options.default;
  }
  /**
   * This function takes the commands that are in the scope of the guild and returns them as an object.
   * @returns The return is a CreateApplicationCommand.
   */
  toGuildApplicationCommand(): CreateApplicationCommand {
    return {
      name: this.name,
      description: this.description,
      options: this.commands
        .filter((e) => e.scope == "guild")
        .map((e) => e.toApplicationCommand())
        .filter((n) => {
          return n.type > 0;
        }),
    };
  }

  /**
   * It takes a list of commands, filters out the ones that are not global, then maps them to an
   * application command, then filters out the ones that are not of type 0.
   * I'm not sure what the options is, but I'm guessing it's an array.
   * @returns The return value is an object with the name, description, and options properties.
   */
  toApplicationCommand() {
    return {
      name: this.name,
      description: this.description,
      options: this.commands
        .filter((e) => e.scope == "global")
        .map((e) => e.toApplicationCommand())
        .filter((n) => {
          return n.type > 0;
        }),
    };
  }

  /**
   * If the command is unique, return the command if it's name matches the command name and it's type
   * is message. If the command is not unique, return the command if it's name matches the command name
   * and it's type is message. If the command is not unique, return the command if it's name matches
   * the subcommand name and it's type is message.
   * @param {string} commandName - The name of the command you want to get.
   * @param {string} [subCommandName] - The name of the subcommand.
   * @returns The command that is being returned is the command that is being called.
   */
  getCommand(
    commandName: string,
    subCommandName?: string
  ): {
    command?: CommandClass,
    usedSubCommand: boolean,
  } {
    if (this.uniqueCommands) {
      for (let i = 0; i < this.commands.size; i++)
        if (
          this.commands.at(i)!.name == commandName &&
          this.commands.at(i)?.commandType.includes("message")
        )
          return { command: this.commands.at(i), usedSubCommand: true };
    } else {
      if (this.name == commandName) {

        for (let i = 0; i < this.commands.size; i++) {
          if (subCommandName)
            if (
              (this.commands.at(i)!.name == subCommandName.trim() || this.commands.at(i)!.aliases.includes(subCommandName.trim())) &&
              this.commands.at(i)?.commandType.includes("message")
            )
              return {
                command: this.commands.at(i)!,
                usedSubCommand: true
              }
        }
        return {
          command: this.commands.get(this.default), usedSubCommand: false
        };
      }
    }

    return {
      usedSubCommand: true
    };
  }

  /**
   * If the command name is the same as the command name passed in, then check if the subcommand name
   * is the same as the subcommand name passed in, if it is, return the command, if it isn't, check if
   * the command name is the same as the subcommand name passed in, if it is, return the command, if it
   * isn't, return undefined.
   * @param {string} commandName - The name of the command you want to get.
   * @param {string} [subCommandName] - The name of the subcommand.
   * @returns a Command or undefined.
   */
  getCommandFromInteraction(
    commandName: string,
    subCommandName?: string
  ): CommandClass | undefined {
    if (this.name == commandName) {
      for (let i = 0; i < this.commands.size; i++) {
        if (subCommandName)
          for (let i = 0; i < this.commands.size; i++)
            if (
              this.commands.at(i)!.name == commandName &&
              this.commands.at(i)?.commandType.includes("application")
            )
              return this.commands.at(i)!;
            else
              for (let i = 0; i < this.commands.size; i++)
                if (
                  this.commands.at(i)!.name == subCommandName &&
                  this.commands.at(i)?.commandType.includes("application")
                )
                  return this.commands.at(i)!;
      }
    }

    return undefined;
  }
}
