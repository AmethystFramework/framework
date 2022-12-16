import {
  Bot,
  DiscordChannel,
  DiscordGuild,
  DiscordGuildMemberAdd,
  DiscordGuildMemberRemove,
  DiscordGuildMemberUpdate,
  DiscordGuildRoleUpdate,
  DiscordMessage,
  DiscordMessageReactionAdd,
  DiscordMessageReactionRemove,
  DiscordMessageReactionRemoveAll,
  DiscordUnavailableGuild,
  DiscordUser,
} from "../../deps.ts";
import { BotWithProxyCache, ProxyCacheTypes } from "./mod.ts";

export const unavailablesGuilds = new Set<bigint>();

export function setupCacheEdits<B extends Bot>(
  bot: BotWithProxyCache<ProxyCacheTypes, B>
) {
  const {
    GUILD_MEMBER_ADD,
    GUILD_MEMBER_REMOVE,
    MESSAGE_REACTION_ADD,
    MESSAGE_REACTION_REMOVE,
    MESSAGE_REACTION_REMOVE_ALL,
    CHANNEL_UPDATE,
    MESSAGE_UPDATE,
    GUILD_UPDATE,
    GUILD_ROLE_UPDATE,
    GUILD_MEMBER_UPDATE,
    USER_UPDATE,
  } = bot.handlers;

  bot.handlers.GUILD_MEMBER_ADD = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildMemberAdd;

    const guildID = bot.transformers.snowflake(payload.guild_id);
    const guild = await bot.cache.guilds.get(guildID, false);
    // Update cache
    if (guild) {
      guild.memberCount++;
      await bot.cache.guilds.set(guild);
    } else {
      await bot.cache.guilds.get(guildID);
    }

    GUILD_MEMBER_ADD(bot, data, shardId);
  };

  bot.handlers.GUILD_MEMBER_REMOVE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildMemberRemove;

    const guildID = bot.transformers.snowflake(payload.guild_id);
    const guild = await bot.cache.guilds.get(guildID, false);
    if (guild) {
      guild.memberCount--;
      bot.cache.guilds.set(guild);
    } else {
      await bot.cache.guilds.get(guildID);
    }

    GUILD_MEMBER_REMOVE(bot, data, shardId);
  };

  bot.handlers.MESSAGE_REACTION_ADD = async function (_, data, shardId) {
    const payload = data.d as DiscordMessageReactionAdd;

    const messageId = bot.transformers.snowflake(payload.message_id);

    const message = await bot.cache.messages.get(
      messageId,
      bot.transformers.snowflake(payload.channel_id),
      undefined
    );

    const emoji = bot.transformers.emoji(bot, payload.emoji);

    // if the message is cached
    if (message) {
      const reactions = message.reactions?.map((r) => r.emoji.name);
      const toSet = {
        count: 1,
        me: bot.transformers.snowflake(payload.user_id) === bot.id,
        emoji: emoji,
      };

      // if theres no reaction add it
      if (!message.reactions || !reactions) {
        message.reactions = [toSet];
      } else if (!reactions.includes(emoji.name)) {
        message.reactions?.push(toSet);
      } else {
        // otherwise the reaction has already been added so +1 to the reaction count
        const current = message.reactions?.[reactions.indexOf(emoji.name)];

        // rewrite
        if (current) {
          current.count++;
        }
      }

      bot.cache.messages.set(message);
    } else {
      await bot.cache.messages.get(
        messageId,
        BigInt(payload.channel_id),
        payload.guild_id ? BigInt(payload.guild_id) : undefined
      );
    }

    MESSAGE_REACTION_ADD(bot, data, shardId);
  };

  bot.handlers.MESSAGE_REACTION_REMOVE = async function (_, data, shardId) {
    const payload = data.d as DiscordMessageReactionRemove;

    const messageId = bot.transformers.snowflake(payload.message_id);
    const message = await bot.cache.messages.get(
      messageId,
      bot.transformers.snowflake(payload.channel_id),
      undefined
    );

    const emoji = bot.transformers.emoji(bot, payload.emoji);

    // if the message is cached
    if (message) {
      const reactions = message.reactions?.map((r) => r.emoji.name);

      if (reactions?.indexOf(emoji.name) !== undefined) {
        const current = message.reactions?.[reactions.indexOf(emoji.name)];

        if (current) {
          if (current.count > 0) {
            current.count--;
          }
          // delete when count is 0
          if (current.count === 0) {
            message.reactions?.splice(reactions?.indexOf(emoji.name), 1);
          }
          // when someone deleted a reaction that doesn't exist in the cache just pass
        }
      }

      bot.cache.messages.set(message);
    } else {
      await bot.cache.messages.get(
        messageId,
        BigInt(payload.channel_id),
        payload.guild_id ? BigInt(payload.guild_id) : undefined
      );
    }

    MESSAGE_REACTION_REMOVE(bot, data, shardId);
  };

  bot.handlers.MESSAGE_REACTION_REMOVE_ALL = async function (_, data, shardId) {
    const payload = data.d as DiscordMessageReactionRemoveAll;

    const messageId = bot.transformers.snowflake(payload.message_id);
    const message = await bot.cache.messages.get(
      messageId,
      bot.transformers.snowflake(payload.channel_id)
    );

    if (message) {
      // when an admin deleted all the reactions of a message
      message.reactions = undefined;

      bot.cache.messages.set(message);
    } else {
      await bot.cache.messages.get(
        messageId,
        BigInt(payload.channel_id),
        payload.guild_id ? BigInt(payload.guild_id) : undefined
      );
    }

    MESSAGE_REACTION_REMOVE_ALL(bot, data, shardId);
  };

  bot.handlers.CHANNEL_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordChannel;
    const oldChannel = await bot.cache.channels.get(
      BigInt(payload.id),
      payload.guild_id ? BigInt(payload.guild_id) : undefined,
      false
    );

    //TODO: This transformer is wierd. Make it better. {channel: channel} is not necessary.
    const channel = bot.transformers.channel(bot, { channel: payload });

    await bot.cache.channels.set(channel);

    //Send the event.
    if (bot.events.channelUpdateWithOldChannel)
      bot.events.channelUpdateWithOldChannel(
        bot,
        oldChannel ?? channel,
        channel
      );
    CHANNEL_UPDATE(bot, data, shardId);
  };

  bot.handlers.MESSAGE_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordMessage;
    if (!payload.edited_timestamp) return;
    const oldMessage = await bot.cache.messages.get(
      BigInt(payload.id),
      bot.transformers.snowflake(payload.channel_id),
      undefined,
      false
    );
    const message = bot.transformers.message(bot, payload);

    await bot.cache.messages.set(message);

    //Send the event.
    if (bot.events.messageUpdateWithOldMessage)
      bot.events.messageUpdateWithOldMessage(
        bot,
        oldMessage ?? message,
        message
      );

    MESSAGE_UPDATE(bot, data, shardId);
  };

  bot.handlers.GUILD_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuild;
    const oldGuild = await bot.cache.guilds.get(BigInt(payload.id), false);
    const guild = bot.transformers.guild(bot, {
      guild: payload,
      shardId: shardId,
    });

    await bot.cache.guilds.set(guild);
    if (bot.events.guildUpdateWithOldGuild)
      bot.events.guildUpdateWithOldGuild(bot, oldGuild ?? guild, guild);

    GUILD_UPDATE(bot, data, shardId);
  };

  bot.handlers.GUILD_ROLE_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildRoleUpdate;
    const oldRole = await bot.cache.roles.get(
      BigInt(payload.role.id),
      BigInt(payload.guild_id),
      false
    );
    const role = bot.transformers.role(bot, {
      role: payload.role,
      guildId: BigInt(payload.guild_id),
    });

    await bot.cache.roles.set(role);
    //Send the event.
    if (bot.events.guildRoleUpdateWithOldRole)
      bot.events.guildRoleUpdateWithOldRole(bot, oldRole ?? role, role);
    GUILD_ROLE_UPDATE(bot, data, shardId);
  };

  bot.handlers.USER_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordUser;
    const oldUser = await bot.cache.users.get(BigInt(payload.id), false);
    const user = bot.transformers.user(bot, payload);

    await bot.cache.users.set(user);
    if (oldUser && bot.events.userUpdateWithOldUser)
      bot.events.userUpdateWithOldUser(bot, oldUser, user);
    USER_UPDATE(bot, data, shardId);
  };

  bot.handlers.GUILD_MEMBER_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildMemberUpdate;
    const oldMember = await bot.cache.members.get(
      BigInt(payload.user.id),
      BigInt(payload.guild_id),
      false
    );

    const member = bot.transformers.member(
      bot,
      payload,
      BigInt(payload.guild_id),
      BigInt(payload.user.id)
    );

    await bot.cache.members.set(member);

    if (bot.events.guildMemberUpdateWithOldMember)
      bot.events.guildMemberUpdateWithOldMember(
        bot,
        oldMember ?? member,
        member
      );
    GUILD_MEMBER_UPDATE(bot, data, shardId);
  };

  bot.handlers.GUILD_UPDATE = function (_, data, shardId) {
    const payload = data.d as DiscordUnavailableGuild;

    const guildID = bot.transformers.snowflake(payload.id);

    // If Guild isn't available push to Set
    if (payload.unavailable) unavailablesGuilds.add(guildID);
    // otherwise remove from Set
    else unavailablesGuilds.delete(guildID);

    GUILD_UPDATE(bot, data, shardId);
  };
}
