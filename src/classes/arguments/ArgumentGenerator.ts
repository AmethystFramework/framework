import { AmethystCollection } from "../../utils/mod.ts";
import { CommandClient, Argument } from "../mod.ts";
import { stringArgument } from "./stringArgument.ts";
import { multiStringArgument } from "./multiStringArgument.ts";

export class ArgumentGenerator {
  client: CommandClient;
  arguments: AmethystCollection<string, Argument>;
  constructor(client: CommandClient) {
    this.client = client;
    this.arguments = new AmethystCollection();
    this.arguments.set(multiStringArgument.name, multiStringArgument);
    this.arguments.set(stringArgument.name, stringArgument);
  }
}
