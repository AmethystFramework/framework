import { PermissionStrings } from "../../deps.ts";
import { CommandClass } from "../../mod.ts";
import { Context } from "../classes/Context.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystError, ErrorEnums } from "../interfaces/errors.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";

export const inhibitors = new AmethystCollection<
  string,
  <T extends CommandClass = CommandClass>(
    bot: AmethystBot,
    command: T,
    context: Context
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

// deno-lint-ignore require-await
inhibitors.set("ownerOnly", async (bot, command, options) => {
  if (
    command.ownerOnly &&
    (!options?.author!.id || !bot.owners?.includes(options.author!.id))
  )
    return { type: ErrorEnums.OWNER_ONLY };
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
      !(
        await bot.helpers.getMember(options.guildId!, options.author!.id)
      ).permissions!.hasAll(command.userGuildPermissions))
  )
    return {
      type: ErrorEnums.USER_MISSING_PERMISSIONS,
      channel: false,
      value: command.userGuildPermissions,
    };

  return true;
});
