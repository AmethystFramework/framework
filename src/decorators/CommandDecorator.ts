import { cache } from "../cache.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { CommandOptions } from "../types/commandOptions.ts";

export function Command(options: CommandOptions): MethodDecorator {
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

    bot.utils.createCommand(options);
  };
}
