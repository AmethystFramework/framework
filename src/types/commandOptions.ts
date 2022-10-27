import { PermissionStrings } from "../../deps.ts";
import { Context } from "../classes/Context.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { CommandCooldown } from "../interfaces/command.ts";
import { commandOption } from "../interfaces/commandArgumentOptions.ts";

export type CommandOptions = {
  /* Name of the command */
  name: string;
  /* Information about the command */
  description: string;
  /* Category the command belongs to. */
  category: string;
  /* Arguments to be passed to the command */
  args: commandOption[];
  /* Alternate names for this command */
  aliases?: string[];
  /* Type of command */
  commandType:
    | ["application", "message"]
    | ["message", "application"]
    | ["message"]
    | ["application"];
  /**The command cooldown*/
  cooldown?: CommandCooldown;
  /**Whether the command is allowed to run in non-nsfw channels*/
  nsfw?: boolean;
  /**Whether the command can only be used by the bot's owners*/
  ownerOnly?: boolean;
  /**The channel permissions needed by the member to execute the command*/
  userChannelPermissions?: PermissionStrings[];
  /**The guild permissions needed by the member to execute the command*/
  userGuildPermissions?: PermissionStrings[];
  /**The channel permissions needed by the bot to execute the command*/
  botChannelPermissions?: PermissionStrings[];
  /**The guild permissions needed by the bot to execute the command*/
  botGuildPermissions?: PermissionStrings[];
  /**If the command can only be used in guilds*/
  guildOnly?: true;
  /**If the command can only be used in dms*/
  dmOnly?: false;
  /** The command scope
   * @default "global" */
  scope?: string;
  /**A list of guild ids that will have the command*/
  guildIds?: bigint[];
  quotedArguments?: boolean;
  /**Ignore bots when they try to use the command*/
  ignoreBots?: boolean;
  extras?: any;
  botCacheNumber?: number;
  execute?: (bot: AmethystBot, ctx: Context) => unknown;
};
