import {
  ApplicationCommandOption,
  ApplicationCommandOptionTypes,
  ChannelTypes,
  PermissionStrings,
} from "../../deps.ts";
import {
  AmethystBot,
  CommandCooldown,
  commandOption,
  Context,
} from "../../mod.ts";
import { CommandOptions } from "../types/commandOptions.ts";

const defaultFunction = (bot: AmethystBot, ctx: Context): void => {
  console.warn("THe Execute Function if not defined.");
};
/* It creates a class called Command. */
export class CommandClass {
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
  extras: any;
  execute: (bot: AmethystBot, ctx: Context) => unknown;

  /**
   * It takes in a CommandOptions object and a client object, and then sets the properties of the
   * Command object to the properties of the CommandOptions object
   * @param {CommandOptions} options - CommandOptions - The options for the command.
   * @param {AmethystBot} client - AmethystBot - The client object
   */
  constructor(options: CommandOptions, client: AmethystBot) {
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
    this.dmOnly = options.dmOnly ?? true;
    this.scope = options.scope ?? "global";
    this.guildIds = options.guildIds ?? [];
    this.quotedArguments = options.quotedArguments ?? false;
    this.ignoreBots = options.ignoreBots ?? true;
    this.nsfw = options.nsfw ?? false;
    this.ownerOnly = options.ownerOnly ?? false;
    this.execute = options.execute ?? defaultFunction;
    this.extras = options.extras ?? {};
  }

  /**
   * If the command type is not an application command, return a default object. Otherwise, return the
   * command object with the options mapped to the correct types
   * @returns An object with the following properties:
   */
  toApplicationCommand(): ApplicationCommandOption {
    if (!this.commandType.includes("application"))
      return {
        type: -99,
        name: this.name,
        description: this.description,
      };
    return {
      type: 1,
      name: this.name,
      description: this.description,
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

  /**
   * It updates the command's properties with the options passed in
   * @param {CommandOptions} options - CommandOptions - The options object that is passed to the
   * constructor.
   * @param {AmethystBot} client - AmethystBot - The client that the command is being registered to.
   */
  update(options: CommandOptions, client: AmethystBot) {
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
    this.execute = options.execute ?? defaultFunction;
  }
}
