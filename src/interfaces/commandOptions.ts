import {
  ApplicationCommandOptionTypes,
  Interaction,
  Message,
  ChannelTypes,
  Locales,
  ApplicationCommandOptionChoice,
  InteractionDataOption,
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
    | ApplicationCommandOptionTypes
    | keyof typeof ApplicationCommandOptionTypes;
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
}
