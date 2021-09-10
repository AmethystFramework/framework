import { AmethystCollection } from "../../utils/mod.ts";
import { CommandClient } from "../mod.ts";
import { Argument } from "../structures/Argument.ts";
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
