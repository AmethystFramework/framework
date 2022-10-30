import {
  BitwisePermissionFlags,
  Channel,
  Errors,
  Guild,
  Member,
  OverwriteReadable,
  PermissionStrings,
  Role,
  separateOverwrites,
} from "../../deps.ts";
import { AmethystBot } from "../interfaces/bot.ts";

/** Calculates the permissions this member has in the given guild */
export function calculateBasePermissions(
  bot: AmethystBot,
  guild: Guild,
  member: Member
) {
  let permissions = 0n;
  // Calculate the role permissions bits, @everyone role is not in memberRoleIds so we need to pass guildId manually
  permissions |=
    [...member.roles, guild.id]
      .map((id) => guild.roles.get(id)?.permissions)
      // Removes any edge case undefined
      .filter((perm) => perm)
      .reduce((bits, perms) => {
        bits! |= perms!;
        return bits;
      }, 0n) || 0n;

  // If the memberId is equal to the guild ownerId he automatically has every permission so we add ADMINISTRATOR permission
  if (guild.ownerId === member.id) permissions |= 8n;
  // Return the members permission bits as a string
  return permissions;
}

/** Calculates the permissions this member has for the given Channel */
export async function calculateChannelOverwrites(
  bot: AmethystBot,
  channelOrId: bigint | Channel,
  memberOrId: bigint | Member
) {
  const channel =
    typeof channelOrId === "bigint"
      ? await bot.cache.channels.get(channelOrId)
      : channelOrId;

  // This is a DM channel so return ADMINISTRATOR permission
  if (!channel?.guildId) return 8n;

  const member =
    typeof memberOrId === "bigint"
      ? await bot.cache.members.get(channel.guildId, memberOrId)
      : memberOrId;

  if (!channel || !member) return 8n;

  // Get all the role permissions this member already has
  let permissions = calculateBasePermissions(
    bot,
    (await bot.cache.guilds.get(channel.guildId))!,
    member
  );

  // First calculate @everyone overwrites since these have the lowest priority
  const overwriteEveryone = channel.permissionOverwrites?.find((overwrite) => {
    const [_, id] = separateOverwrites(overwrite);
    return id === channel.guildId;
  });
  if (overwriteEveryone) {
    const [_type, _id, allow, deny] = separateOverwrites(overwriteEveryone);
    // First remove denied permissions since denied < allowed
    permissions &= ~deny;
    permissions |= allow;
  }

  const overwrites = channel.permissionOverwrites;

  // In order to calculate the role permissions correctly we need to temporarily save the allowed and denied permissions
  let allow = 0n;
  let deny = 0n;
  const memberRoles = member.roles || [];
  // Second calculate members role overwrites since these have middle priority
  for (const overwrite of overwrites || []) {
    const [_type, id, allowBits, denyBits] = separateOverwrites(overwrite);

    if (!memberRoles.includes(id)) continue;

    deny |= denyBits;
    allow |= allowBits;
  }
  // After role overwrite calculate save allowed permissions first we remove denied permissions since "denied < allowed"
  permissions &= ~deny;
  permissions |= allow;

  // Third calculate member specific overwrites since these have the highest priority
  const overwriteMember = overwrites?.find((overwrite) => {
    const [_, id] = separateOverwrites(overwrite);
    return id === member.id;
  });
  if (overwriteMember) {
    const [_type, _id, allowBits, denyBits] =
      separateOverwrites(overwriteMember);

    permissions &= ~denyBits;
    permissions |= allowBits;
  }

  return permissions;
}

/** Checks if the given permission bits are matching the given permissions. `ADMINISTRATOR` always returns `true` */
export function validatePermissions(
  permissionBits: bigint,
  permissions: PermissionStrings[]
) {
  if (permissionBits & 8n) return true;

  return permissions.every(
    (permission) =>
      // Check if permission is in permissionBits
      permissionBits & BigInt(BitwisePermissionFlags[permission])
  );
}

/** Checks if the given member has these permissions in the given guild */
export function hasGuildPermissions(
  bot: AmethystBot,
  guild: Guild,
  member: Member,
  permissions: PermissionStrings[]
) {
  // First we need the role permission bits this member has
  const basePermissions = calculateBasePermissions(bot, guild, member);
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(basePermissions, permissions);
}

/** Checks if the bot has these permissions in the given guild */
export async function botHasGuildPermissions(
  bot: AmethystBot,
  guild: Guild,
  permissions: PermissionStrings[]
) {
  const member = await bot.cache.members.get(guild.id, bot.id);
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasGuildPermissions(bot, guild, member!, permissions);
}

/** Checks if the given member has these permissions for the given channel */
export async function hasChannelPermissions(
  bot: AmethystBot,
  channel: Channel | bigint,
  member: Member | bigint,
  permissions: PermissionStrings[]
) {
  // First we need the overwrite bits this member has
  const channelOverwrites = await calculateChannelOverwrites(
    bot,
    channel,
    member
  );
  // Second use the validatePermissions function to check if the member has every permission
  return validatePermissions(channelOverwrites, permissions);
}

/** Checks if the bot has these permissions f0r the given channel */
export function botHasChannelPermissions(
  bot: AmethystBot,
  channel: bigint | Channel,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the hasRolePermissions() function
  return hasChannelPermissions(bot, channel, bot.id, permissions);
}

/** Returns the permissions that are not in the given permissionBits */
export function missingPermissions(
  permissionBits: bigint,
  permissions: PermissionStrings[]
) {
  if (permissionBits & 8n) return [];

  return permissions.filter(
    (permission) =>
      !(permissionBits & BigInt(BitwisePermissionFlags[permission]))
  );
}

/** Get the missing Guild permissions this member has */
export function getMissingGuildPermissions(
  bot: AmethystBot,
  guild: Guild,
  member: Member,
  permissions: PermissionStrings[]
) {
  // First we need the role permission bits this member has
  const permissionBits = calculateBasePermissions(bot, guild, member);
  // Second return the members missing permissions
  return missingPermissions(permissionBits, permissions);
}

/** Get the missing Channel permissions this member has */
export async function getMissingChannelPermissions(
  bot: AmethystBot,
  channel: bigint | Channel,
  member: bigint | Member,
  permissions: PermissionStrings[]
) {
  // First we need the role permission bits this member has
  const permissionBits = await calculateChannelOverwrites(bot, channel, member);
  // Second return the members missing permissions
  return missingPermissions(permissionBits, permissions);
}

/** Throws an error if this member has not all of the given permissions */
export function requireGuildPermissions(
  bot: AmethystBot,
  guild: Guild,
  member: Member,
  permissions: PermissionStrings[]
) {
  const missing = getMissingGuildPermissions(bot, guild, member, permissions);
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}

/** Throws an error if the bot does not have all permissions */
export async function requireBotGuildPermissions(
  bot: AmethystBot,
  guild: Guild,
  permissions: PermissionStrings[]
) {
  const member = await bot.cache.members.get(guild.id, bot.id);
  // Since Bot is a normal member we can use the throwOnMissingGuildPermission() function
  return requireGuildPermissions(bot, guild, member!, permissions);
}

/** Throws an error if this member has not all of the given permissions */
export async function requireChannelPermissions(
  bot: AmethystBot,
  channel: bigint | Channel,
  member: bigint | Member,
  permissions: PermissionStrings[]
) {
  const missing = await getMissingChannelPermissions(
    bot,
    channel,
    member,
    permissions
  );
  if (missing.length) {
    // If the member is missing a permission throw an Error
    throw new Error(`Missing Permissions: ${missing.join(" & ")}`);
  }
}

/** Throws an error if the bot has not all of the given channel permissions */
export function requireBotChannelPermissions(
  bot: AmethystBot,
  channel: bigint | Channel,
  permissions: PermissionStrings[]
) {
  // Since Bot is a normal member we can use the throwOnMissingChannelPermission() function
  return requireChannelPermissions(bot, channel, bot.id, permissions);
}

/** Internal function to check if the bot has the permissions to set these overwrites */
export async function requireOverwritePermissions(
  bot: AmethystBot,
  guildOrId: Guild,
  overwrites: OverwriteReadable[]
) {
  const member = await bot.cache.members.get(guildOrId.id, bot.id);
  let requiredPerms: Set<PermissionStrings> = new Set(["MANAGE_CHANNELS"]);

  overwrites?.forEach((overwrite) => {
    if (overwrite.allow)
      overwrite.allow.forEach(requiredPerms.add, requiredPerms);
    if (overwrite.deny)
      overwrite.deny.forEach(requiredPerms.add, requiredPerms);
  });

  // MANAGE_ROLES permission can only be set by administrators
  if (requiredPerms.has("MANAGE_ROLES"))
    requiredPerms = new Set<PermissionStrings>(["ADMINISTRATOR"]);

  requireGuildPermissions(bot, guildOrId, member!, [...requiredPerms]);
}

/** Gets the highest role from the member in this guild */
export async function highestRole(
  bot: AmethystBot,
  guildOrId: bigint | Guild,
  memberOrId: bigint | Member
) {
  const guild =
    typeof guildOrId === "bigint"
      ? await bot.cache.guilds.get(guildOrId)
      : guildOrId;
  if (!guild) throw new Error(Errors.GUILD_NOT_FOUND);

  // Get the roles from the member
  const memberRoles = (
    typeof memberOrId === "bigint"
      ? await bot.cache.members.get(guild.id, memberOrId)
      : memberOrId
  )?.roles;
  // This member has no roles so the highest one is the @everyone role
  if (!memberRoles) return guild.roles.get(guild.id)!;

  let memberHighestRole: Role | undefined;

  for (const roleId of memberRoles) {
    const role = guild.roles.get(roleId);
    // Rare edge case handling if undefined
    if (!role) continue;

    // If memberHighestRole is still undefined we want to assign the role,
    // else we want to check if the current role position is higher than the current memberHighestRole
    if (
      !memberHighestRole ||
      memberHighestRole.position < role.position ||
      memberHighestRole.position === role.position
    ) {
      memberHighestRole = role;
    }
  }

  // The member has at least one role so memberHighestRole must exist
  return memberHighestRole!;
}

/** Checks if the first role is higher than the second role */
export async function higherRolePosition(
  bot: AmethystBot,
  guildOrId: bigint | Guild,
  roleId: bigint,
  otherRoleId: bigint
) {
  const guild =
    typeof guildOrId === "bigint"
      ? await bot.cache.guilds.get(guildOrId)
      : guildOrId;
  if (!guild) return true;

  const role = guild.roles.get(roleId);
  const otherRole = guild.roles.get(otherRoleId);
  if (!role || !otherRole) throw new Error(Errors.ROLE_NOT_FOUND);

  // Rare edge case handling
  if (role.position === otherRole.position) return role.id < otherRole.id;

  return role.position > otherRole.position;
}

/** Checks if the member has a higher position than the given role */
export async function isHigherPosition(
  bot: AmethystBot,
  guildOrId: bigint | Guild,
  memberId: bigint,
  compareRoleId: bigint
) {
  const guild =
    typeof guildOrId === "bigint"
      ? await bot.cache.guilds.get(guildOrId)
      : guildOrId;

  if (!guild || guild.ownerId === memberId) return true;

  const memberHighestRole = await highestRole(bot, guild, memberId);
  return higherRolePosition(bot, guild.id, memberHighestRole.id, compareRoleId);
}

/** Checks if a channel overwrite for a user id or a role id has permission in this channel */
export function channelOverwriteHasPermission(
  guildId: bigint,
  id: bigint,
  overwrites: bigint[],
  permissions: PermissionStrings[]
) {
  const overwrite =
    overwrites.find((perm) => {
      const [_, bitID] = separateOverwrites(perm);
      return id === bitID;
    }) ||
    overwrites.find((perm) => {
      const [_, bitID] = separateOverwrites(perm);
      return bitID === guildId;
    });

  if (!overwrite) return false;

  return permissions.every((perm) => {
    const [_type, _id, allowBits, denyBits] = separateOverwrites(overwrite);
    if (BigInt(denyBits) & BigInt(BitwisePermissionFlags[perm])) return false;
    if (BigInt(allowBits) & BigInt(BitwisePermissionFlags[perm])) return true;
  });
}
