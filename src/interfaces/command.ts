import {
  DiscordenoInteraction,
  ApplicationCommandTypes,
  ApplicationCommandOption,
  Collection,
  Permission,
  MakeRequired,
  DiscordenoMessage,
} from "../../deps.ts";
import {
  ArgumentDefinition,
  ConvertArgumentDefinitionsToArgs,
} from "./arguments.ts";
import { AmethystBot } from "./bot.ts";

export interface CommandCooldown {
  seconds: number;
  allowedUses?: number;
}

export interface BaseCommand {
  name: string;
  description?: string;
  category?: string;
  guildOnly?: boolean;
  dmOnly?: boolean;
  cooldown?: CommandCooldown;
  ignoreCooldown?: bigint[];
  hasRoles?: bigint[];
  nsfw?: boolean;
  ownerOnly?: boolean;
  userChannelPermissions?: Permission[];
  userGuildPermissions?: Permission[];
  botChannelPermissions?: Permission[];
  botGuildPermissions?: Permission[];
}

// Message Commands

export interface MessageCommand<T extends readonly ArgumentDefinition[]>
  extends BaseCommand {
  aliases?: string[];
  arguments?: T;
  subcommands?: Collection<string, Omit<MessageCommand<T>, "category">>;
  execute?: (
    bot: AmethystBot,
    message: DiscordenoMessage,
    args: ConvertArgumentDefinitionsToArgs<T>
  ) => unknown;
}

// Slash Commands

export interface SlashCommand extends MakeRequired<BaseCommand, "description"> {
  defaultPermission?: boolean;
  /**
   * Defaults to "global"
   */
  scope?: "guild" | "global";
  guildIds?: bigint[];
  type?: ApplicationCommandTypes;
  options?: ApplicationCommandOption[];
  subcommands?: Collection<string, SlashSubcommandGroup | SlashSubcommand>;
  execute?: (bot: AmethystBot, data: DiscordenoInteraction) => unknown;
}

export interface SlashSubcommandGroup {
  name: string;
  description: string;
  SubcommandType?: "subcommandGroup";
  subcommands?: Collection<string, SlashSubcommand>;
}

export interface SlashSubcommand extends Omit<SlashCommand, "subcommands"> {
  SubcommandType?: "subcommand";
}
