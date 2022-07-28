import {
  ApplicationCommandOptionTypes,
  Interaction,
  Message,
  ChannelTypes,
  Locales,
  Channel,
  ApplicationCommandOptionChoice,
  InteractionDataOption,
  User,
  Member,
  Role,
  Attachment,
} from "../../deps.ts";
import { AmethystBot } from "./bot.ts";

export interface commandOption {
  /**The command name*/
  name: string;
  /**The command description
   * Default to "A slash option" for slash commands*/
  description?: string;
  /**The option type*/
  type:
    | Omit<ApplicationCommandOptionTypes, "SubCommand" | "SubCommandGroup">
    | keyof Omit<
        typeof ApplicationCommandOptionTypes,
        "SubCommand" | "SubCommandGroup"
      >;

  /**Whether the option is required or not, defaults to "false"*/
  required?: boolean;
  /**The minimum value for numbers, or the minimum amount of characters for a string*/
  minValue?: number;
  /**The max value for numbets, or the max amount of characters for a string*/
  maxValue?: number;
  /**The autocomplete function for string types on slash commands*/
  autoComplete?: (bot: AmethystBot, data: Interaction) => unknown;
  /**The function that will be emitted when a required option not being passed by the user*/
  missing?: (bot: AmethystBot, message: Message, optionName: string) => unknown;
  /**The choices for a string option in a slash command*/
  choices?: ApplicationCommandOptionChoice[];
  /**The types that will be returned*/
  channelTypes?: (ChannelTypes | keyof typeof ChannelTypes)[] | ChannelTypes[];
  /**Localization object for the description field in a slash command. Values follow the same restrictions as description*/
  descriptionLocalizations?: Partial<Record<Locales, string>>;
  /**Localization object for the name field in slash commands. Values follow the same restrictions for the name*/
  nameLocalizations?: Partial<Record<Locales, string>>;
}

export interface result {
  value: InteractionDataOption["value"];
  focused?: boolean;
  type: ApplicationCommandOptionTypes;
  name: string;
}

export interface optionResults {
  /**An array of the returned results*/
  results: result[];
  /**Will get the option through it's name without checking it's type*/
  // deno-lint-ignore no-explicit-any
  get(name: string, required?: boolean): any;
  /**Will get the string option*/
  getString(name: string, required?: false): string | undefined;
  getString(name: string, required: true): string;
  /**Will get the number option*/
  getNumber(name: string, required?: false): number | undefined;
  getNumber(name: string, required: true): number;
  /**Will get the integer option*/
  getInteger(name: string, required?: false): number | undefined;
  getInteger(name: string, required: true): number;
  /**Will get the boolean option*/
  getBoolean(name: string, required?: false): boolean | undefined;
  getBoolean(name: string, required: true): boolean;
  /**Will get the user option*/
  getUser(name: string, required?: false): User | undefined;
  getUser(name: string, required: true): User;
  /**Will get the member from the cache*/
  getMember(
    name: string,
    options: {
      required?: false;
      force?: false;
    }
  ): Member | undefined;
  getMember(name: string, options: { required: true; force?: false }): Member;
  getMember(
    name: string,
    options: { required?: false; force: true }
  ): Promise<Member | undefined>;
  getMember(
    name: string,
    options: { required: true; force: true }
  ): Promise<Member>;
  /**Gets the role option*/
  getRole(name: string, required?: false): Role;
  getRole(name: string, required: true): Role;
  /**Gets any mentionable discord object (roles, channels, members)*/
  getMentionable(name: string, required?: false): Role | User | undefined;
  getMentionable(name: string, required: true): Role | User;
  /**Gets the attachment option*/
  getAttachment(name: string, required?: false): Attachment | undefined;
  getAttachment(name: string, required: true): Attachment;
  /**Gets the channel option*/
  getChannel(name: string, required?: false): Channel | undefined;
  getChannel(name: string, required: true): Channel;
}
