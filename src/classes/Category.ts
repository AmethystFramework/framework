import { AmethystBot, Command } from "../../mod.ts";
import categoryOptions from "../types/categoryOptions.ts";

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
  commands: Command[];

  constructor(options: categoryOptions, client: AmethystBot) {}
}
