import {
  Bot,
  DiscordChannel,
  DiscordGuildBanAddRemove,
  DiscordGuildMemberRemove,
  DiscordGuildRoleDelete,
  DiscordMessageDelete,
  DiscordMessageDeleteBulk,
  DiscordUnavailableGuild,
} from "../../deps.ts";
import { BotWithProxyCache, ProxyCacheTypes } from "./mod.ts";
import { unavailablesGuilds } from "./setupCacheEdits.ts";

export function setupCacheRemovals<B extends Bot>(
  bot: BotWithProxyCache<ProxyCacheTypes, B>
) {
  const {
    CHANNEL_DELETE,
    GUILD_BAN_ADD,
    GUILD_DELETE,
    GUILD_MEMBER_REMOVE,
    GUILD_ROLE_DELETE,
    MESSAGE_DELETE_BULK,
  } = bot.handlers;

  bot.handlers.GUILD_DELETE = async function (_, data, shardId) {
    const payload = data.d as DiscordUnavailableGuild;
    const id = bot.transformers.snowflake(payload.id);
    const guild = await bot.cache.guilds.get(id, false);
    // Remove the guild from cache
    bot.cache.options.bulk?.removeGuild?.(id);
    if (guild)
      if (bot.events.guildDeleteWithOldGuild)
        bot.events.guildDeleteWithOldGuild(bot, guild!);
    // remove guild from unavailable Set
    unavailablesGuilds.delete(id);

    GUILD_DELETE(bot, data, shardId);
  };

  bot.handlers.CHANNEL_DELETE = async function (_, data, shardId) {
    const payload = data.d as DiscordChannel;
    const channel = await bot.cache.channels.get(
      BigInt(payload.id),
      undefined,
      false
    );
    // HANDLER BEFORE DELETING, BECAUSE HANDLER RUNS TRANSFORMER WHICH RE CACHES
    CHANNEL_DELETE(bot, data, shardId);
    if (bot.events.channelDeleteWithOldChannel)
      bot.events.channelDeleteWithOldChannel(bot, channel!);
    const id = bot.transformers.snowflake(payload.id);
    bot.cache.options.bulk?.removeChannel?.(id);
  };

  bot.handlers.GUILD_MEMBER_REMOVE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildMemberRemove;
    GUILD_MEMBER_REMOVE(bot, data, shardId);

    const member = await bot.cache.members.get(
      BigInt(payload.user.id),
      BigInt(payload.guild_id),
      false
    );
    if (bot.events.memberDeleteWithOldMember)
      bot.events.memberDeleteWithOldMember(bot, member!);

    bot.cache.members.delete(
      bot.transformers.snowflake(payload.user.id),
      bot.transformers.snowflake(payload.guild_id)
    );
  };

  bot.handlers.GUILD_BAN_ADD = function (_, data, shardId) {
    const payload = data.d as DiscordGuildBanAddRemove;
    GUILD_BAN_ADD(bot, data, shardId);

    bot.cache.members.delete(
      bot.transformers.snowflake(payload.user.id),
      bot.transformers.snowflake(payload.guild_id)
    );
  };

  // TODO: fix emojis. For now deal with it lazy people or make ur own cache proxy plugin :)
  //   bot.handlers.GUILD_EMOJIS_UPDATE = function (_, data, shardId) {
  //     const payload = data.d as DiscordGuildEmojisUpdate;
  //     const guild = bot.guilds.get(bot.transformers.snowflake(payload.guild_id));

  //     if (guild) {
  //       guild.emojis! = new Collection(
  //         payload.emojis.map((e) => {
  //           const emoji: Emoji = bot.transformers.emoji(bot, e);
  //           return [emoji.id!, emoji];
  //         })
  //       );
  //     }

  //     GUILD_EMOJIS_UPDATE(bot, data, shardId);
  //   };

  bot.handlers.MESSAGE_DELETE = async function (_, data) {
    const payload = data.d as DiscordMessageDelete;
    const id = bot.transformers.snowflake(payload.id);
    const message = await bot.cache.messages.get(
      BigInt(payload.id),
      BigInt(payload.channel_id),
      payload.guild_id ? BigInt(payload.guild_id) : undefined,
      false
    );
    if (bot.events.messageDeleteWithOldMessage)
      bot.events.messageDeleteWithOldMessage(bot, message!);
    // Use .then() strategy to keep this function sync but also no point deleting if its not in cache :bigbrain:
    bot.cache.messages.get(id).then((message) => {
      // DON'T RUN INTERNAL HANDLER since internal does not pass `message`
      bot.events.messageDelete(
        {
          id,
          channelId: bot.transformers.snowflake(payload.channel_id),
          guildId: payload.guild_id
            ? bot.transformers.snowflake(payload.guild_id)
            : undefined,
        },
        message
      );

      bot.cache.messages.delete(id);
    });
  };

  bot.handlers.MESSAGE_DELETE_BULK = function (_, data, shardId) {
    const payload = data.d as DiscordMessageDeleteBulk;

    // i have headaches, i need a break
    bot.cache.options.bulk?.removeMessages?.(
      payload.ids.map((id) => bot.transformers.snowflake(id))
    );

    MESSAGE_DELETE_BULK(bot, data, shardId);
  };

  bot.handlers.GUILD_ROLE_DELETE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildRoleDelete;
    const id = bot.transformers.snowflake(payload.role_id);
    const role = await bot.cache.roles.get(id, BigInt(payload.guild_id), false);
    if (bot.events.roleDeleteWithOldRole)
      bot.events.roleDeleteWithOldRole(bot, role!);
    bot.cache.options.bulk?.removeRole?.(id);

    GUILD_ROLE_DELETE(bot, data, shardId);
  };
}
