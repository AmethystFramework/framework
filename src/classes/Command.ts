import {
  ApplicationCommandOptionTypes,
  ChannelTypes,
  PermissionStrings,
} from "../../deps.ts";
import {
  AmethystBot,
  CommandCooldown,
  commandOption,
  context,
} from "../../mod.ts";
import commandOptions from "../types/commandOptions.ts";

export default class Command {
  /* Name of the command */
  name: string;
  /* Information about the command */
  description: string;
  /* Category the command belongs to. */
  category: string;
  /* Arguments to be passed to the command */
  args: commandOption[];
  /* Alternate names for this command */
  aliases: string[];
  /* Type of command */
  commandType: string[];
  /**The command cooldown*/
  cooldown?: CommandCooldown;
  /**Whether the command is allowed to run in non-nsfw channels*/
  nsfw: boolean;
  /**Whether the command can only be used by the bot's owners*/
  ownerOnly: boolean;
  /**The channel permissions needed by the member to execute the command*/
  userChannelPermissions: PermissionStrings[];
  /**The guild permissions needed by the member to execute the command*/
  userGuildPermissions: PermissionStrings[];
  /**The channel permissions needed by the bot to execute the command*/
  botChannelPermissions: PermissionStrings[];
  /**The guild permissions needed by the bot to execute the command*/
  botGuildPermissions: PermissionStrings[];
  /**If the command can only be used in guilds*/
  guildOnly: boolean;
  /**If the command can only be used in dms*/
  dmOnly: boolean;
  /** The command scope
   * @default "global" */
  scope: string;
  /**A list of guild ids that will have the command*/
  guildIds: bigint[];
  quotedArguments: boolean;
  /**Ignore bots when they try to use the command*/
  ignoreBots: boolean;
  execute: (bot: AmethystBot, ctx: context) => unknown;

  constructor(
    options: commandOptions,
    execute: (bot: AmethystBot, ctx: context) => unknown,
    client: AmethystBot
  ) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category;
    this.args = options.args ?? [];
    this.aliases = options.aliases ?? [];
    this.commandType = options.commandType;
    this.cooldown = options.cooldown ?? client.defaultCooldown;
    this.userChannelPermissions = options.userChannelPermissions ?? [];
    this.userGuildPermissions = options.userGuildPermissions ?? [];
    this.botChannelPermissions = options.botChannelPermissions ?? [];
    this.botGuildPermissions = options.botGuildPermissions ?? [];
    this.guildOnly = options.guildOnly ?? true;
    this.dmOnly = options.dmOnly ?? false;
    this.scope = options.scope ?? "global";
    this.guildIds = options.guildIds ?? [];
    this.quotedArguments = options.quotedArguments ?? false;
    this.ignoreBots = options.ignoreBots ?? true;
    this.nsfw = options.nsfw ?? false;
    this.ownerOnly = options.ownerOnly ?? false;
    this.execute = execute;
  }

  toApplicationCommand() {
    return {
      name: this.name,
      description: this.description,
      dm_permission: this.dmOnly,
      options: this.args?.length
        ? this.args.map((e) => {
            return {
              ...e,
              description: e.description ?? "A slash command option",
              channelTypes: e.channelTypes?.map((f) =>
                typeof f == "string" ? ChannelTypes[f] : f
              ),
              type:
                typeof e.type == "number"
                  ? e.type
                  : ApplicationCommandOptionTypes[
                      e.type as keyof typeof ApplicationCommandOptionTypes
                    ],
            };
          })
        : [],
    };
  }

  update(
    options: commandOptions,
    execute: (bot: AmethystBot, ctx: context) => unknown,
    client: AmethystBot
  ) {
    this.name = options.name;
    this.description = options.description;
    this.category = options.category;
    this.args = options.args ?? [];
    this.aliases = options.aliases ?? [];
    this.commandType = options.commandType;
    this.cooldown = options.cooldown ?? client.defaultCooldown;
    this.userChannelPermissions = options.userChannelPermissions ?? [];
    this.userGuildPermissions = options.userGuildPermissions ?? [];
    this.botChannelPermissions = options.botChannelPermissions ?? [];
    this.botGuildPermissions = options.botGuildPermissions ?? [];
    this.guildOnly = options.guildOnly ?? true;
    this.dmOnly = options.dmOnly ?? false;
    this.scope = options.scope ?? "global";
    this.guildIds = options.guildIds ?? [];
    this.quotedArguments = options.quotedArguments ?? false;
    this.ignoreBots = options.ignoreBots ?? true;
    this.nsfw = options.nsfw ?? false;
    this.ownerOnly = options.ownerOnly ?? false;
    this.execute = execute;
  }
}
