import {
  Bot,
  DiscordGuild,
  DiscordGuildMembersChunk,
  DiscordUnavailableGuild,
  Guild,
} from "../../deps.ts";
import { BotWithProxyCache, ProxyCacheTypes } from "./mod.ts";
import { unavailablesGuilds } from "./setupCacheEdits.ts";

export function setupCacheCreations<B extends Bot>(
  bot: BotWithProxyCache<ProxyCacheTypes, B>
) {
  const { GUILD_CREATE, GUILD_LOADED_DD, GUILD_MEMBERS_CHUNK } = bot.handlers;

  bot.handlers.GUILD_CREATE = function (_, data, shardId) {
    // handle it as unavailable cuz we dont know what we're really getting
    const payload = data.d as DiscordUnavailableGuild;
    const id = bot.transformers.snowflake(payload.id);

    // add guild to unavailable Set if its unavailable
    if (payload.unavailable) unavailablesGuilds.add(id);

    GUILD_CREATE(bot, data, shardId);
  };

  bot.handlers.GUILD_LOADED_DD = function (_, data, shardId) {
    const payload = data.d as DiscordGuild;

    bot.transformers.guild(bot, {
      guild: payload,
      shardId,
    }) as Guild;

    GUILD_LOADED_DD(bot, data, shardId);
  };

  bot.handlers.GUILD_MEMBERS_CHUNK = function (_, data, shardId) {
    const payload = data.d as DiscordGuildMembersChunk;

    payload.members.forEach((member) => {
      bot.transformers.member(
        bot,
        member,
        BigInt(payload.guild_id),
        BigInt(member.user.id)
      );
    });
  };
}
