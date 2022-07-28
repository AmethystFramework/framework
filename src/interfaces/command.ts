import {
  ApplicationCommandOption,
  ApplicationCommandTypes,
  PermissionStrings,
} from "../../deps.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";
import { AmethystBot } from "./bot.ts";
import { commandOption } from "./commandOptions.ts";
import { context } from "./context.ts";

export interface CommandCooldown {
  /**The amount of seconds before the command is useable again*/
  seconds: number;
  /**The amount of uses that can be used before the seconds passes*/
  allowedUses?: number;
}

/**The base command interface that's used to create the other command interfaces*/
export type Command<T extends "application" | "message" = never> = {
  /**The command name*/
  name: string;
  /**The command type
   * @default ["application"]
   * */
  commandType?: "application" | "message" extends T
    ? T[]
    :
        | ["application", "message"]
        | ["message", "application"]
        | ["message"]
        | ["application"];
  /**The command options*/
  options: commandOption[];
  /**The command description*/
  description?: string;
  /**The category that can be used to organize commands*/
  category?: string;
  /**The command cooldown*/
  cooldown?: CommandCooldown;
  /**Whether the command is allowed to run in non-nsfw channels*/
  nsfw?: boolean;
  /**Whether the command can only be used by the bot's owners*/
  ownerOnly?: boolean;
  /** A collection of subcommands */
  subcommands?: AmethystCollection<string, subcommandGroup<T> | subcommand<T>>;
  /**A list of member and role ids that can bypass the command cooldown*/
  ignoreCooldown?: bigint[];
  /**A list of of ids for roles the user needs to run the command*/
  hasRoles?: bigint[];
  /**Execute the command*/
  execute?: (bot: AmethystBot, ctx: context<T>) => unknown;
} & (
  | {
      /**If the command can only be used in guilds*/
      guildOnly?: true;
      /**If the command can only be used in dms*/
      dmOnly?: false;
      /**Checks if the member has the necessary roles to run the command*/
      hasRoles?: bigint[];
      /**The channel permissions needed by the member to execute the command*/
      userChannelPermissions?: PermissionStrings[];
      /**The guild permissions needed by the member to execute the command*/
      userGuildPermissions?: PermissionStrings[];
      /**The channel permissions needed by the bot to execute the command*/
      botChannelPermissions?: PermissionStrings[];
      /**The guild permissions needed by the bot to execute the command*/
      botGuildPermissions?: PermissionStrings[];
    }
  | {
      /**If the command can only be used in dms*/
      dmOnly?: true;
      /**If the command can only be used in guilds*/
      guildOnly?: false;
    }
) &
  ("application" extends T
    ? { description: string; type?: ApplicationCommandTypes } & (
        | {
            /** The command scope
             * @default "global" */
            scope?: "global";
          }
        | {
            /** The command scope
             * @default "global" */
            scope: "guild";
            /**A list of guild ids that will have the command*/
            guildIds?: bigint[];
            /**If the command can only be used in dms*/
            dmOnly?: false;
          }
      )
    : Record<never, never>) &
  ("message" extends T
    ? {
        aliases?: string[];
        quotedArguments?: boolean;
      }
    : Record<never, never>);

/**The interface for slash subcommands groups*/
export interface subcommandGroup<T extends "application" | "message" = never> {
  /**The subcommand group's name*/
  name: string;
  /**The subcommand group's description*/
  description: string;
  /**The subcommand type*/
  SubcommandType?: "subcommandGroup";
  /**A collection of subcommands for the group*/
  subcommands?: AmethystCollection<string, subcommand<T>>;
}

/**The interface for slash subcommands*/
export type subcommand<T extends "application" | "message" = never> =
  Command<T> & {
    /**A list of options for the subcommand*/
    options?: ApplicationCommandOption[];
    /**The subcommand type*/
    SubcommandType?: "subcommand";
  };
