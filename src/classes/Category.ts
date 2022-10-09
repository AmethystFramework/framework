import { CreateApplicationCommand } from "../../deps.ts";
import { AmethystCollection, Command } from "../../mod.ts";
import { CategoryOptions } from "../types/categoryOptions.ts";

export default class Category {
  /* Name of the category */
  name: string;
  /* Information about the category */
  description: string;
  /* Treat each command as a subcommand or a command on its own. */
  uniqueCommands: boolean;
  /* Default command when uniqueCommand is false. */
  default: string;
  /* Commands belonging to this category */
  commands: AmethystCollection<string, Command>;

  constructor(options: CategoryOptions) {
    this.name = options.name;
    this.description = options.description;
    this.uniqueCommands = options.uniqueCommands;
    this.default = options.default;
    this.commands = new AmethystCollection();
  }

  update(options: CategoryOptions) {
    this.name = options.name;
    this.description = options.description;
    this.uniqueCommands = options.uniqueCommands;
    this.default = options.default;
  }
  toGuildApplicationCommand(): CreateApplicationCommand {
    return {
      name: this.name,
      description: this.description,
      options: this.commands
        .filter((e) => e.scope == "guild")
        .map((e) => e.toApplicationCommand())
        .filter((n) => n.type > 0),
    };
  }

  toApplicationCommand() {
    return {
      name: this.name,
      description: this.description,
      options: this.commands
        .filter((e) => e.scope == "guild")
        .map((e) => e.toApplicationCommand())
        .filter((n) => n.type > 0),
    };
  }

  getCommand(
    commandName: string,
    subCommandName?: string
  ): Command | undefined {
    if (this.uniqueCommands) {
      for (let i = 0; i < this.commands.size; i++)
        if (
          this.commands.at(i)!.name.toUpperCase() == commandName &&
          this.commands.at(i)?.commandType.includes("message")
        )
          return this.commands.at(i)!;
    } else {
      if (this.name.toUpperCase() == commandName.toUpperCase()) {
        for (let i = 0; i < this.commands.size; i++) {
          if (subCommandName)
            for (let i = 0; i < this.commands.size; i++)
              if (
                this.commands.at(i)!.name.toUpperCase() == commandName &&
                this.commands.at(i)?.commandType.includes("message")
              )
                return this.commands.at(i)!;
              else
                for (let i = 0; i < this.commands.size; i++)
                  if (
                    this.commands.at(i)!.name.toUpperCase() == subCommandName &&
                    this.commands.at(i)?.commandType.includes("message")
                  )
                    return this.commands.at(i)!;
        }
      }
    }

    return undefined;
  }

  getCommandFromInteraction(
    commandName: string,
    subCommandName?: string
  ): Command | undefined {
    if (this.name.toUpperCase() == commandName.toUpperCase()) {
      for (let i = 0; i < this.commands.size; i++) {
        if (subCommandName)
          for (let i = 0; i < this.commands.size; i++)
            if (
              this.commands.at(i)!.name.toUpperCase() == commandName &&
              this.commands.at(i)?.commandType.includes("application")
            )
              return this.commands.at(i)!;
            else
              for (let i = 0; i < this.commands.size; i++)
                if (
                  this.commands.at(i)!.name.toUpperCase() == subCommandName &&
                  this.commands.at(i)?.commandType.includes("application")
                )
                  return this.commands.at(i)!;
      }
    }

    return undefined;
  }
}
