import { cache } from "../cache.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { AmethystEvent, AmethystEvents } from "../interfaces/event.ts";

export function Event(
  options: AmethystEvent<keyof AmethystEvents>
): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    options.execute = descriptor.value;

    let bot: AmethystBot;

    if (cache.size == 1) bot = cache.first()!;
    else if (options.botCacheNumber) bot = cache.get(options.botCacheNumber)!;
    else bot = cache.first()!;

    bot.on(options.name, options.execute);
  };
}
