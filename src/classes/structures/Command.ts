import { Permission } from "../../../deps.ts";
import {
  ArgumentDefinition,
  Command,
  CommandContext,
  CommandCooldown,
} from "../../types/mod.ts";
import { Awaited } from "../../utils/types.ts";

/** The command class which contains all properties from the Command interface */
export class CommandClass<T extends ArgumentDefinition[] = ArgumentDefinition[]>
  implements Command<T>
{
  /** The class type */
  readonly type = "Command";
  /** The command's name */
  name: string;
  /** The command arguments */
  arguments?: T;
  /** The command's category */
  category?: string;
  /** Command aliases */
  aliases?: string[];
  /** Check whether the command should be dms only */
  dmOnly?: boolean;
  /** Check whether the command should be guilds only */
  guildOnly?: boolean;
  /** Checks if the executor is an owner */
  ownerOnly?: boolean;
  /** Checks if the channel is nsfw */
  nsfw?: boolean;
  /** Checks for user server permissions */
  userServerPermissions?: Permission[];
  /** Checks for user channel permissions */
  userChannelPermissions?: Permission[];
  /** Checks for user server permissions */
  botServerPermissions?: Permission[];
  /** Checks for user channel permissions */
  botChannelPermissions?: Permission[];
  /** The command cooldown */
  cooldown?: CommandCooldown;
  /** A list of user ids that can surpass the cooldown for this command */
  ignoreCooldown?: (bigint | string)[];
  /** Executes the command */
  execute?: (ctx: CommandContext<T>) => Awaited<void>;
  constructor(CommandOptions: Command<T>) {
    this.name = CommandOptions.name;
    this.arguments = CommandOptions.arguments;
    this.category = CommandOptions.category ?? "misc";
    this.aliases = CommandOptions.aliases;
    this.dmOnly = CommandOptions.dmOnly;
    this.guildOnly = CommandOptions.guildOnly;
    this.ownerOnly = CommandOptions.ownerOnly;
    this.nsfw = CommandOptions.nsfw;
    this.userChannelPermissions = CommandOptions.userChannelPermissions;
    this.botChannelPermissions = CommandOptions.botChannelPermissions;
    this.userServerPermissions = CommandOptions.userServerPermissions;
    this.botServerPermissions = CommandOptions.botServerPermissions;
    this.execute = CommandOptions.execute;
  }
}
