import { InteractionResponseTypes } from "https://deno.land/x/discordeno@17.1.0/mod.ts";
import {
  Channel,
  Guild,
  Interaction,
  Member,
  Message,
  User,
} from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";
import { optionResults } from "../interfaces/commandArgumentOptions.ts";

/* It's a class that represents a context of a message or interaction */
export class Context {
  deffered = false;
  replied = false;
  sentMessage: Interaction | Message | undefined;
  interaction?: Interaction;
  message?: Message;
  interactionContext: boolean;
  guildId: bigint | undefined;
  guild?: Guild;
  member?: Member;
  user?: User;
  author?: User;
  client: AmethystBot;
  options: optionResults;
  channel?: Channel;
  id: BigInt;
  constructor(options: ContextOptions, client: AmethystBot) {
    this.interaction = options.interaction;
    this.message = options.message;
    this.interactionContext = options.interactionContext;
    this.guildId = options.guildId;
    this.guild = options.guild;
    this.member = options.member;
    this.user = options.user;
    this.author = options.user;
    this.client = client;
    this.channel = options.channel;
    this.options = options.options;
    this.id = options.id;
    if (this.interaction) {
      client.helpers.sendInteractionResponse(
        this.interaction.id,
        this.interaction.token,
        { type: InteractionResponseTypes.DeferredChannelMessageWithSource }
      );
      this.replied = true;
    }
  }
  /**
   * It's a constructor for the Context class
   * @param {ContextOptions} options - ContextOptions
   * @param {AmethystBot} client - The client instance
   */
  async followUp(content: any): Promise<Context> {
    return await this.reply(content);
  }

  /**
   * The followUp function is a wrapper for the reply function
   * @param {any} content - any - The content to send to the user. This can be a string, an object, or
   * a function that returns a string or object.
   * @returns The context object is being returned.
   */
  async reply(content: any): Promise<Context> {
    if (this.interactionContext && this.interaction) {
      if (this.replied) {
        const msg = await this.client.helpers.sendFollowupMessage(
          this.interaction.token,
          {
            type: 4,
            data: { ...content, flags: content.private ? 1 << 6 : undefined },
          }
        );
        this.sentMessage = msg;
        return await createContext(
          { message: this.sentMessage },
          this.options,
          this.client
        );
      } else {
        await this.client.helpers.sendInteractionResponse(
          this.interaction.id,
          this.interaction.token,
          {
            type: 4,
            data: { ...content, flags: content.empheral ? 1 << 6 : undefined },
          }
        );
        this.replied = true;
        return this;
      }
    } else if (this.message) {
      const msg = await this.client.helpers.sendMessage(
        this.message.channelId,
        {
          ...content,
          messageReference: {
            messageId: this.message.id,
            channelId: this.message.channelId,
            guildId: this.message.guildId,
            failIfNotExists: false,
          },
        }
      );
      this.sentMessage = msg;
      this.replied = true;
      if (content.private)
        this.client.helpers.deleteMessage(
          msg.channelId,
          msg.id,
          undefined,
          5000
        );
      return await createContext(
        { message: this.sentMessage },
        this.options,
        this.client
      );
    } else {
      return this;
    }
  }

  /**
   * If the message is an interaction, edit the original message, otherwise edit the message that was
   * sent.
   * @param {any} content - any - The content to send.
   * @returns The context object.
   */
  async editReply(content: any): Promise<Context> {
    if (this.interactionContext && this.interaction) {
      await this.client.helpers.editOriginalInteractionResponse(
        this.interaction.token,
        content
      );
      return this;
    } else if (this.message) {
      const msg = await this.client.helpers.editMessage(
        this.message.channelId,
        this.message.id,
        content
      );
      this.sentMessage = msg;
      this.replied = true;
      if (content.private)
        this.client.helpers.deleteMessage(
          msg.channelId,
          msg.id,
          undefined,
          5000
        );
      return await createContext(
        { message: this.sentMessage },
        this.options,
        this.client
      );
    } else {
      return this;
    }
  }
}

/**
 * ContextOptions is an object with optional properties interaction, message, interactionContext,
 * guildId, guild, member, options, and user, where interaction and message are of type Interaction and
 * Message, respectively, interactionContext is a boolean, guildId is a bigint or undefined, guild and
 * member are of type Guild and Member, respectively, options is of type optionResults, and user is of
 * type User.
 * @property {Interaction} interaction - The interaction object that was used to trigger the command.
 * @property {Message} message - The message that triggered the command.
 * @property {boolean} interactionContext - boolean - This is a boolean that is true if the command is
 * being used in an interaction.
 * @property {bigint | undefined} guildId - The ID of the guild the command was used in.
 * @property {Guild} guild - The guild the command was used in.
 * @property {Member} member - The member that triggered the command
 * @property {optionResults} options - optionResults;
 * @property {User} user - The user who sent the message
 */
type ContextOptions = {
  interaction?: Interaction;
  message?: Message;
  interactionContext: boolean;
  guildId: bigint | undefined;
  guild?: Guild;
  member?: Member;
  options: optionResults;
  channel?: Channel;
  user?: User;
  id: BigInt;
};

/**
 * It creates a context object for a command
 * @param data - { interaction?: Interaction; message?: Message }
 * @param {optionResults} option - optionResults
 * @param {AmethystBot} bot - AmethystBot - The bot instance.
 * @returns A Context object.
 */
export async function createContext(
  data: { interaction?: Interaction; message?: Message },
  option: optionResults,
  bot: AmethystBot
): Promise<Context> {
  const options: ContextOptions = {
    options: option,
    interaction: data.interaction,
    message: data.message,
    interactionContext: data.message ? false : true,
    guildId: data.message ? data.message.guildId : data.interaction?.guildId,
    user: data.message
      ? await bot.helpers.getUser(data.message.authorId)
      : data.interaction?.user,
    channel: data.message
      ? await bot.cache.channels.get(data.message.channelId)
      : //@ts-ignore this should fix types
        await bot.cache.channels.get(data.interaction.channelId),
    id: data.message ? data.message.id : data.interaction?.message?.id ?? 0n,
  };

  //Assign guild.
  if (data.message && data.message.guildId)
    options.guild = await bot.cache.guilds.get(data.message.guildId);
  else if (data.interaction && data.interaction.guildId)
    options.guild = await bot.cache.guilds.get(data.interaction.guildId);

  // Assign message if context is for a Interaction.
  if (data.interaction && data.interaction.message)
    options.message = data.interaction.message;

  if (data.message && data.message.member) options.member = data.message.member;

  if (data.interaction && data.interaction.member)
    options.member = data.interaction.member;

  return new Context(options, bot);
}
