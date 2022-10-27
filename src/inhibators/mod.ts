import {
  BotWithCache,
  getMissingChannelPermissions,
  getMissingGuildPermissions,
  PermissionStrings,
} from "../../deps.ts";
import { CommandClass } from "../classes/Command.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystError, ErrorEnums } from "../interfaces/errors.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";

export const inhibitors = new AmethystCollection<
  string,
  <T extends CommandClass = CommandClass>(
    bot: AmethystBot,
    command: T,
    options?: { memberId?: bigint; guildId?: bigint; channelId: bigint }
  ) => true | AmethystError
>();

const membersInCooldown = new Map<string, Cooldown>();

interface Cooldown {
  used: number;
  timestamp: number;
}

inhibitors.set("cooldown", (bot, command, options) => {
  const commandCooldown = command.cooldown || bot.defaultCooldown;
  if (
    !commandCooldown ||
    (options?.memberId && bot.ignoreCooldown?.includes(options?.memberId))
  )
    return true;

  const key = `${options!.memberId!}-${command.name}`;
  const cooldown = membersInCooldown.get(key);
  if (cooldown) {
    if (cooldown.used >= (commandCooldown.allowedUses || 1)) {
      const now = Date.now();
      if (cooldown.timestamp > now) {
        return {
          type: ErrorEnums.COOLDOWN,
          value: {
            expiresAt: Date.now() + commandCooldown.seconds * 1000,
            executedAt: Date.now(),
          },
        };
      } else {
        cooldown.used = 0;
      }
    }

    membersInCooldown.set(key, {
      used: cooldown.used + 1,
      timestamp: Date.now() + commandCooldown.seconds * 1000,
    });
    return {
      type: ErrorEnums.COOLDOWN,
      value: {
        expiresAt: Date.now() + commandCooldown.seconds * 1000,
        executedAt: Date.now(),
      },
    };
  }

  membersInCooldown.set(key, {
    used: 1,
    timestamp: Date.now() + commandCooldown.seconds * 1000,
  });
  return true;
});

setInterval(() => {
  const now = Date.now();

  membersInCooldown.forEach((cooldown, key) => {
    if (cooldown.timestamp > now) return;
    membersInCooldown.delete(key);
  });
}, 30000);

inhibitors.set("nsfw", (bot, command, options) => {
  if (
    !options?.guildId ||
    !options?.channelId ||
    !bot.channels.has(options.channelId)
  )
    return { type: ErrorEnums.NSFW };
  const channel = bot.channels.get(options.channelId)!;
  if (command.nsfw && !channel.nsfw) return { type: ErrorEnums.NSFW };
  return true;
});

inhibitors.set("ownerOnly", (bot, command, options) => {
  if (
    command.ownerOnly &&
    (!options?.memberId || !bot.owners?.includes(options.memberId))
  )
    return { type: ErrorEnums.OWNER_ONLY };
  return true;
});

inhibitors.set("botPermissions", (bot, cmd, options) => {
  const command = cmd as CommandClass & {
    botGuildPermissions: PermissionStrings[];
    botChannelPermissions: PermissionStrings[];
  };
  if (
    command.botGuildPermissions?.length &&
    (!options?.guildId ||
      getMissingGuildPermissions(
        bot as unknown as BotWithCache,
        options.guildId,
        bot.id,
        command.botGuildPermissions
      ).length)
  )
    return {
      type: ErrorEnums.BOT_MISSING_PERMISSIONS,
      channel: false,
      value: getMissingGuildPermissions(
        bot as unknown as BotWithCache,
        options!.guildId!,
        bot.id,
        command.botGuildPermissions
      ),
    };
  if (
    command.botChannelPermissions?.length &&
    (!options?.channelId ||
      getMissingChannelPermissions(
        bot as unknown as BotWithCache,
        options.channelId,
        bot.id,
        command.botChannelPermissions
      ).length)
  )
    return {
      type: ErrorEnums.BOT_MISSING_PERMISSIONS,
      channel: true,
      value: getMissingChannelPermissions(
        bot as unknown as BotWithCache,
        options!.channelId!,
        bot.id,
        command.botChannelPermissions
      ),
    };
  return true;
});

inhibitors.set("userPermissions", (bot, cmd, options) => {
  const command = cmd as CommandClass & {
    userGuildPermissions: PermissionStrings[];
    userChannelPermissions: PermissionStrings[];
  };

  if (
    command.userGuildPermissions?.length &&
    (!options?.guildId ||
      !options.memberId ||
      getMissingGuildPermissions(
        bot as unknown as BotWithCache,
        options.guildId,
        options.memberId,
        command.userGuildPermissions
      ).length)
  )
    return {
      type: ErrorEnums.USER_MISSING_PERMISSIONS,
      channel: false,
      value: getMissingGuildPermissions(
        bot as unknown as BotWithCache,
        options!.guildId!,
        options!.memberId!,
        command.userGuildPermissions
      ),
    };
  if (
    command.userChannelPermissions?.length &&
    (!options?.memberId ||
      !options?.channelId ||
      getMissingChannelPermissions(
        bot as unknown as BotWithCache,
        options.channelId,
        options.memberId,
        command.userChannelPermissions
      ).length)
  )
    return {
      type: ErrorEnums.USER_MISSING_PERMISSIONS,
      channel: true,
      value: getMissingGuildPermissions(
        bot as unknown as BotWithCache,
        options!.guildId!,
        options!.memberId!,
        command.userChannelPermissions
      ),
    };
  return true;
});
