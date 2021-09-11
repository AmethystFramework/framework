import { AmethystCollection } from "../../utils/mod.ts";
import { Argument } from "../mod.ts";
import { stringArgument } from "./stringArgument.ts";
import { multiStringArgument } from "./multiStringArgument.ts";

export class ArgumentGenerator {
  arguments: AmethystCollection<string, Argument>;
  constructor() {
    this.arguments = new AmethystCollection();
    this.arguments.set(multiStringArgument.name, multiStringArgument);
    this.arguments.set(stringArgument.name, stringArgument);
  }
}
