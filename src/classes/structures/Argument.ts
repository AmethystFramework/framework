import { ArgumentDefinition, CommandContext } from "../../types/mod.ts";
import { Awaited } from "../../utils/mod.ts";

interface executeData {
  parameters: string[];
  context: CommandContext<never>;
  argument: Omit<ArgumentDefinition, "arguments">;
}

export class Argument<T = unknown> {
  /** Argument name */
  public readonly name: string;
  /** The argument execution */
  execute?: (data: executeData) => Awaited<T | undefined>;
  constructor(options: Omit<Argument<T>, "type">) {
    this.name = options.name;
    this.execute = options.execute;
  }
}
