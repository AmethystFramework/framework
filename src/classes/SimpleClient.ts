import { botId, startBot } from "../../deps.ts";
import { SimpleClientOptions, SimpleClientEvents } from "../types/mod.ts";

/** A simple client */
export class SimpleClient {
  /** The client's options */
  public readonly options: SimpleClientOptions;
  /** An object that contains all the event functions */
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
