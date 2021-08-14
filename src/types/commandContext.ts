import { DiscordenoGuild, DiscordenoMessage } from "../../deps.ts";
import { CommandClient } from "../classes/CommandClient.ts";

export interface CommandContext {
  /** The command message */
  message: DiscordenoMessage;
  /** The command client */
  client: CommandClient;
  /** The guild where the command is executed (could be undefined if guild isn't cached / command executed in dms) */
  guild?: DiscordenoGuild;
}
