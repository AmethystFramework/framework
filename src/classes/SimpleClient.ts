import { botId, startBot } from "../../deps.ts";
import { SimpleClientOptions } from "../types/clientOptions.ts";
import { SimpleClientEvents } from "../types/eventHandlers.ts";

export class SimpleClient {
  public readonly options: SimpleClientOptions;
  public eventHandlers: Partial<SimpleClientEvents> = {};
  constructor(options: SimpleClientOptions) {
    this.options = options;
  }

  /** The bot member */
  get id() {
    return botId;
  }

  /** Start the bot */
  async start() {
    return await startBot({
      ...this.options,
      eventHandlers: this.eventHandlers,
    });
  }
}
