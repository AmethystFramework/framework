import { cache } from "../cache.ts";
import { AmethystBot } from "../interfaces/bot.ts";
import { CategoryOptions } from "../types/categoryOptions.ts";

export function Category(options: CategoryOptions): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction) {
    if (cache.size == 0) {
      console.error("There is no instance of a amethystBot");
      return;
    }

    let bot: AmethystBot;

    if (cache.size == 1) bot = cache.first()!;
    else if (options.botCacheNumber) bot = cache.get(options.botCacheNumber)!;
    else bot = cache.first()!;

    bot.amethystUtils.createCategory(options);
  };
}
