import { cache } from "../cache.ts";
import { AmethystBot } from "../interfaces/bot.ts";

export function Event(name: string, botCacheNumber?: number): MethodDecorator {
  return function (
    _target: any,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    let bot: AmethystBot;

    if (cache.size == 1) bot = cache.first()!;
    else if (botCacheNumber) bot = cache.get(botCacheNumber)!;
    else bot = cache.first()!;

    bot.on(name, descriptor.value);
  };
}
