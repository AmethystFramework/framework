import {
  ApplicationCommandOption,
  ApplicationCommandTypes,
  Collection,
  Interaction,
  MakeRequired,
  PermissionStrings,
} from "../../deps.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";
import { ArgumentDefinition } from "./arguments.ts";
import { AmethystBot } from "./bot.ts";
import { context } from "./context.ts";

export interface CommandCooldown {
  /**The amount of seconds before the command is useable again*/
  seconds: number;
  /**The amount of uses that can be used before the seconds passes*/
  allowedUses?: number;
}

/**The base command interface that's used to create the other command interfaces*/
export type BaseCommand =
  & {
    /**The command name*/
    name: string;
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
    /**A list of member and role ids that can bypass the command cooldown*/
    ignoreCooldown?: bigint[];
    /** Execute the command */
    //    execute(bot: AmethystBot, ctx: context): unknown;
  }
  & (
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
      dmOnly: true;
      /**If the command can only be used in guilds*/
      guildOnly?: false;
    }
  );
/*& (T extends "application" | never ? {
    subcommands: AmethystCollection<
      string,
      SlashSubcommandGroup | Omit<BaseCommand, "subcommands">
    >;
  }
    : "message" extends T ? { aliases?: string[] }
    : never);
*/
// Message Commands

/**The command interface for message commands*/
export type MessageCommand<T extends readonly ArgumentDefinition[]> =
  & BaseCommand
  & {
    /**The command aliases*/
    aliases?: string[];
    /**The command arguments*/
    arguments?: T;
    /**A collection of subcommands*/
    subcommands?: Collection<string, Omit<MessageCommand<T>, "category">>;
  };

// Slash Commands

/**The command interface for slash commands*/
export type SlashCommand =
  & MakeRequired<BaseCommand, "description">
  & {
    /**Whether the command is enabled by default when the app is added to a guild*/
    defaultPermission?: boolean;
    /**The application command type (context menus/input command)*/
    type?: ApplicationCommandTypes;
    /**A list of options for the command*/
    options?: ApplicationCommandOption[];
    /**A collection of */
    subcommands?: Collection<string, SlashSubcommandGroup | SlashSubcommand>;
    execute?: (bot: AmethystBot, data: Interaction) => unknown;
  }
  & (
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
  );
/**The interface for slash subcommands groups*/
export interface SlashSubcommandGroup {
  /**The subcommand group's name*/
  name: string;
  /**The subcommand group's description*/
  description: string;
  /**The subcommand type*/
  SubcommandType?: "subcommandGroup";
  /**A collection of subcommands for the group*/
  subcommands?: Collection<string, SlashSubcommand>;
}

/**The interface for slash subcommands*/
export type SlashSubcommand = BaseCommand & {
  /**A list of options for the subcommand*/
  options?: ApplicationCommandOption[];
  /**The subcommand type*/
  SubcommandType?: "subcommand";
  execute?: (bot: AmethystBot, data: Interaction) => unknown;
};
