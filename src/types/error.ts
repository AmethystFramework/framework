import { CommandContext } from "./mod.ts";
import { Permission } from "../../deps.ts";

/** The error enums */
export enum CommandError {
  OWNER_ONLY,
  NSFW_ONLY,
  DMS_ONLY,
  GUILDS_ONLY,
  USER_MISSING_PERMISSIONS,
  BOT_MISSING_PERMISSIONS,
  COOLDOWN,
}

/** The default format of the error */
interface BaseError {
  type: Exclude<
    CommandError,
    UserPermissionsError["type"] | BotPermissionsError["type"]
  >;
  context: CommandContext;
}

/** The error format that is used everytime the user is missing permissions*/
interface UserPermissionsError extends Omit<BaseError, "type"> {
  type: CommandError.USER_MISSING_PERMISSIONS;
  channel: boolean;
  value: Permission[];
}

/** The error format that is used everytime the bot is missing permissions*/
interface BotPermissionsError extends Omit<BaseError, "type"> {
  type: CommandError.BOT_MISSING_PERMISSIONS;
  channel: boolean;
  value: Permission[];
}

interface CooldownError extends Omit<BaseError, "type"> {
  type: CommandError.BOT_MISSING_PERMISSIONS;
  channel: boolean;
  value: { expiresAt: number; executedAt: number };
}

/** The overall error type */
export type AmethystError =
  | BaseError
  | UserPermissionsError
  | BotPermissionsError
  | CooldownError;
