import { CommandContext } from "./commandContext.ts";
import { Permission } from "../../deps.ts";

export enum CommandError {
  OWNER_ONLY,
  NSFW_ONLY,
  DMS_ONLY,
  GUILDS_ONLY,
  USER_MISSING_PERMISSIONS,
  BOT_MISSING_PERMISSIONS,
}

interface BaseError {
  type: Exclude<
    CommandError,
    UserPermissionsError["type"] | BotPermissionsError["type"]
  >;
  context: CommandContext;
}
interface UserPermissionsError extends Omit<BaseError, "type"> {
  type: CommandError.USER_MISSING_PERMISSIONS;
  channel: boolean;
  value: Permission[];
}

interface BotPermissionsError extends Omit<BaseError, "type"> {
  type: CommandError.BOT_MISSING_PERMISSIONS;
  channel: boolean;
  value: Permission[];
}

export type AmethystError =
  | BaseError
  | UserPermissionsError
  | BotPermissionsError;
