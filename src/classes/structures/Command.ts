import { Permission } from "../../../deps.ts";
import { Command, CommandContext, CommandCooldown } from "../../types/mod.ts";

/** The command class which contains all properties from the Command interface */
export class CommandClass implements Command {
  /** The class type */
  public readonly type = "Command";
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
  /** The command cooldown */
  public cooldown?: CommandCooldown;
  /** A list of user ids that can surpass the cooldown for this command */
  public ignoreCooldown?: (bigint | string)[];
  /** Executes the command */
  execute?: (ctx: CommandContext) => Promise<void> | void;
  constructor(CommandOptions: Command) {
    Object.keys(CommandOptions).forEach((key) => {
      // @ts-ignore -
      this[key] = CommandOptions[key];
    });
  }
}
