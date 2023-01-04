// deno-lint-ignore-file
import { PermissionStrings } from "../../deps.ts";
import {
  CommandClass,
  getMissingChannelPermissions,
  getMissingGuildPermissions,
} from "../../mod.ts";
import { Context } from '../classes/Context.ts';
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystError, ErrorEnums } from "../interfaces/errors.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";

export const inhibitors = new AmethystCollection<
  string,
  <T extends CommandClass = CommandClass>(
    bot: AmethystBot,
    command: T,
    context: Context,
  ) => Promise<true | AmethystError>
>();

const membersInCooldown = new Map<string, Cooldown>();

interface Cooldown {
  used: number;
  timestamp: number;
}

inhibitors.set("cooldown", async (bot, command, options) => {
  const commandCooldown = command.cooldown || bot.defaultCooldown;
  if (
    !commandCooldown ||
    (options?.author!.id && bot.ignoreCooldown?.includes(options?.author!.id))
  )
    return true;

  const key = `${options!.author!.id!}-${command.name}`;
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

inhibitors.set("nsfw", async (bot, command, options) => {
  const channel = (await bot.helpers.getChannel(options!.channel!.id))!;
  if (command.nsfw && !channel.nsfw) return { type: ErrorEnums.NSFW };
  return true;
});

// deno-lint-ignore require-await
inhibitors.set("ownerOnly", async (bot, command, options) => {
  if (
    command.ownerOnly &&
    (!options?.author!.id || !bot.owners?.includes(options.author!.id))
  )
    return { type: ErrorEnums.OWNER_ONLY };
  return true;
});

inhibitors.set("botPermissions", async (bot, cmd, options) => {
  const command = cmd as CommandClass & {
    botGuildPermissions: PermissionStrings[];
    botChannelPermissions: PermissionStrings[];
  };

  if (
    command.botGuildPermissions?.length &&
    (!options?.guildId ||
      getMissingGuildPermissions(
        bot,
        options.guild!,
        (await bot.cache.members.get(bot.id, options.guildId))!,
        command.botGuildPermissions
      ).length)
  )
    return {
      type: ErrorEnums.BOT_MISSING_PERMISSIONS,
      channel: false,
      value: getMissingGuildPermissions(
        bot,
        (await bot.cache.guilds.get(options?.guildId!))!,
        (await bot.cache.members.get(bot.id, options?.guildId!))!,
        command.botGuildPermissions
      ),
    };
  if (
    command.botChannelPermissions?.length &&
    (!options?.channel!.id ||
      (
        await getMissingChannelPermissions(
          bot,
          options.channel!.id,
          bot.id,
          command.botChannelPermissions
        )
      ).length)
  )
    return {
      type: ErrorEnums.BOT_MISSING_PERMISSIONS,
      channel: true,
      value: await getMissingChannelPermissions(
        bot,
        options!.channel!.id!,
        bot.id,
        command.botChannelPermissions
      ),
    };
  return true;
});

inhibitors.set("userPermissions", async (bot, cmd, options) => {
  const command = cmd as CommandClass & {
    userGuildPermissions: PermissionStrings[];
    userChannelPermissions: PermissionStrings[];
  };

  if (
    command.userGuildPermissions?.length &&
    (!options?.guildId ||
      !options.author!.id ||
      getMissingGuildPermissions(
        bot,
        options.guild!,
        options.member!,
        command.userGuildPermissions
      ).length)
  )
    return {
      type: ErrorEnums.USER_MISSING_PERMISSIONS,
      channel: false,
      value: getMissingGuildPermissions(
        bot,
        options.guild!,
        options.member!,
        command.userGuildPermissions
      ),
    };
  if (
    command.userChannelPermissions?.length &&
    (!options?.guildId ||
      !options.author!.id ||
      (
        await getMissingChannelPermissions(
          bot,
          options.channel!,
          options.member!,
          command.userChannelPermissions
        )
      ).length)
  )
    return {
      type: ErrorEnums.USER_MISSING_PERMISSIONS,
      channel: true,
      value: getMissingGuildPermissions(
        bot,
        options.guild!,
        options.member!,
        command.userChannelPermissions
      ),
    };
  return true;
});
