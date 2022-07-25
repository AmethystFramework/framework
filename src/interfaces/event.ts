import {
  Bot,
  BotWithCache,
  EventHandlers,
  Interaction,
  Message,
} from "../../deps.ts";
import { AmethystBot } from "./bot.ts";
import { Command } from "./command.ts";
import { AmethystError } from "./errors.ts";

export type Events = {
  [K in keyof EventHandlers]: EventHandlers[K] extends (
    bot: infer T,
    ...rest: infer R
  ) => infer U
    ? BotWithCache<Bot> extends T
      ? (bot: AmethystBot, ...rest: R) => U
      : (...rest: Parameters<EventHandlers[K]>) => U
    : never;
};

export interface AmethystEvents extends Events {
  commandError(
    bot: AmethystBot,
    data: {
      error: AmethystError;
      data?: Interaction;
      message?: Message;
    }
  ): unknown;
  commandNotFound(
    bot: AmethystBot,
    message: Message,
    commandName: string
  ): unknown;
  commandStart<E extends Command = Command>(
    bot: AmethystBot,
    command: E,
    dataOrMessage: Interaction | Message
  ): unknown;
  commandEnd<E extends Command = Command>(
    bot: AmethystBot,
    command: E,
    dataOrMessage: Interaction | Message
  ): unknown;
}

export interface AmethystEvent<T extends keyof AmethystEvents> {
  name: T;
  execute(...args: [...Parameters<AmethystEvents[T]>]): unknown;
}
