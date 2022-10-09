import { Guild, Interaction, Member, Message, User } from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";
import { optionResults } from "../interfaces/commandOptions.ts";

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
    this.options = options.options;
  }
  async followUp(content: any): Promise<Context> {
    return await this.reply(content);
  }

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
            data: { ...content, flags: content.private ? 1 << 6 : undefined },
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

type ContextOptions = {
  interaction?: Interaction;
  message?: Message;
  interactionContext: boolean;
  guildId: bigint | undefined;
  guild?: Guild;
  member?: Member;
  options: optionResults;
  user?: User;
};

/**
 * Creates a new context object.
 * @param data The data to create the context with.
 * @param bot The bot instance.
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
  };

  //Assign guild.
  if (data.message && data.message.guildId)
    options.guild = await bot.helpers.getGuild(data.message.guildId);
  else if (data.interaction && data.interaction.guildId)
    options.guild = await bot.helpers.getGuild(data.interaction.guildId);

  // Assign message if context is for a Interaction.
  if (data.interaction && data.interaction.message)
    options.message = data.interaction.message;

  if (data.message && data.message.member) options.member = data.message.member;

  if (data.interaction && data.interaction.member)
    options.member = data.interaction.member;

  return new Context(options, bot);
}
