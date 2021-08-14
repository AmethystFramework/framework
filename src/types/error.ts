import { CommandContext } from "./commandContext.ts";

export enum CommandError {
  OWNER_ONLY,
  NSFW_ONLY,
  DMS_ONLY,
  GUILDS_ONLY,
  USER_MISSING_PERMISSIONS,
}

export interface AmethystError {
  type: CommandError;
  context: CommandContext;
  // deno-lint-ignore no-explicit-any
  value?: any;
}
