import { DiscordenoGuild, DiscordenoMessage } from "../../deps.ts";
import { CommandClient } from "../classes/CommandClient.ts";

export interface CommandContext {
  message: DiscordenoMessage;
  client: CommandClient;
  guild?: DiscordenoGuild;
}
