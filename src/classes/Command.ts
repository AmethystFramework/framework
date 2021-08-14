import { Permission } from "../../deps.ts";
import { Command as command } from "../types/Command.ts";
import { CommandContext } from "../types/commandContext.ts";

export class Command implements command {
  /** The command's name */
  // @ts-ignore -
  public name: string;
  /** The command's category */
  public category?: string;
  /** Command aliases */
  public aliases?: string[];
  /** Check whether the command should be dms only */
  public dmOnly?: boolean;
  /** Check whether the command should be guilds only */
  public guildOnly?: boolean;
  /** Checks if the executor is an owner */
  public ownerOnly?: boolean;
  /** Checks if the channel is nsfw */
  public nsfw?: boolean;
  /** Checks for user server permissions */
  public userServerPermissions?: Permission[];
  /** Checks for user channel permissions */
  public userChannelPermissions?: Permission[];
  /** Executes the command */
  execute?: (ctx: CommandContext) => Promise<void> | void;
  constructor(CommandOptions: command) {
    Object.keys(CommandOptions).forEach((key) => {
      // @ts-ignore -
      this[key] = CommandOptions[key];
    });
  }
}
