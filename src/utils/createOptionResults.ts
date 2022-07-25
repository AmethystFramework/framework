import { Interaction, Message } from "../../deps.ts";
import { AmethystBot, Errors } from "../../mod.ts";
import { commandOption, optionResults } from "../interfaces/commandOptions.ts";

export function createOptionResults(
  bot: AmethystBot,
  options: commandOption[],
  data: { interaction?: Interaction; message?: Message & { args: string[] } }
): optionResults {
  return {
    results: data.interaction?.data?.options
      ? data.interaction.data?.options.map((e) => {
          return { ...e, value: e.value! };
        })
      : data.message?.content
      ? data.message.args.map((arg, index) => {
          const option = options[index];
          return { name: option.name, value: arg, type: 3 };
        })
      : [],
    get(name, required) {
      const res = this.results.find((e) => e.name == name);
      if (!res && required) {
        const option = options.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError)
          bot.events.commandError(bot, {
            error: { type: Errors.MISSING_REQUIRED_ARGUMENTS, value: name },
            message: data.message,
          });
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return res?.value;
    },
    getString(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 3);
      if (!res && required) {
        const option = options.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError)
          bot.events.commandError(bot, {
            error: { type: Errors.MISSING_REQUIRED_ARGUMENTS, value: name },
            message: data.message,
          });
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return res?.value as string;
    },
  };
}
