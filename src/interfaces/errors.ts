import { PermissionStrings } from "../../deps.ts";

export enum ErrorEnums {
  OWNER_ONLY,
  NSFW,
  DMS_ONLY,
  GUILDS_ONLY,
  USER_MISSING_PERMISSIONS,
  BOT_MISSING_PERMISSIONS,
  COOLDOWN,
  MISSING_REQUIRED_ROLES,
  MISSING_REQUIRED_ARGUMENTS,
  OTHER,
}

export interface BaseError {
  type: Exclude<
    ErrorEnums,
    | UserPermissionsError["type"]
    | BotPermissionsError["type"]
    | CooldownError["type"]
    | MissingRequiredRoles["type"]
    | MissingRequiredArguments["type"]
  >;
}

export interface MissingRequiredArguments {
  type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS;
  value: string;
}

export interface MissingRequiredRoles {
  type: ErrorEnums.MISSING_REQUIRED_ROLES;
  value: bigint[];
}

export interface CooldownError {
  type: ErrorEnums.COOLDOWN;
  value: { expiresAt: number; executedAt: number };
}

export interface UserPermissionsError {
  type: ErrorEnums.USER_MISSING_PERMISSIONS;
  channel: boolean;
  value: PermissionStrings[];
}

export interface BotPermissionsError {
  type: ErrorEnums.BOT_MISSING_PERMISSIONS;
  channel: boolean;
  value: PermissionStrings[];
}

export type AmethystError =
  | BaseError
  | UserPermissionsError
  | BotPermissionsError
  | CooldownError
  | MissingRequiredRoles
  | MissingRequiredArguments;
