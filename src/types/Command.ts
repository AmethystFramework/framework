import { Permission } from "../../deps.ts";
import { Awaited } from "../utils/types.ts";
import { CommandContext } from "./mod.ts";

export interface CommandCooldown {
  seconds: number;
  allowedUses: number;
}

/** The default command interface */
export interface Command {
  /** Command name */
  name: string;
  /** Command category */
  category?: string;
  /** The command description */
  description?: string;
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
  /** Checks for bot server permissions */
  botServerPermissions?: Permission[];
  /** Checks for bot channel permissions */
  botChannelPermissions?: Permission[];
  /** The command cooldown */
  cooldown?: CommandCooldown;
  /** A list of user ids that can surpass the cooldown for this command */
  ignoreCooldown?: (bigint | string)[];
  /** Executes the command */
  execute?: (ctx: CommandContext) => Awaited<void>;
}
