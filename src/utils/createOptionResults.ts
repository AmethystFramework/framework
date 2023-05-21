import {
  ApplicationCommandOptionTypes,
  Attachment,
  Channel,
  Interaction,
  Message,
  Role,
  User,
} from "../../deps.ts";
import { AmethystBot, ErrorEnums } from "../../mod.ts";
import {
  commandOption,
  optionResults,
  result,
} from "../interfaces/commandArgumentOptions.ts";

/**
 * It takes an array of options, and an object containing a message or interaction, and returns an
 * object containing functions to get the values of the options
 * @param {AmethystBot} bot - AmethystBot - The bot instance
 * @param {commandOption[]} options - commandOption[] - The options that the command has.
 * @param data - { interaction?: Interaction; message?: Message & { args: string[] } }
 * @returns an object with a bunch of functions.
 */
export function createOptionResults(
  bot: AmethystBot,
  options: commandOption[],
  data: { interaction?: Interaction; message?: Message & { args: string[] } }
): optionResults {
  return {
    results: (data.interaction?.data?.options
      ? data.interaction.data?.options[0].options?.map((e) => {
          return { ...e, value: e.value! };
        })
      : data.message?.args.length && options?.length
      ? data.message.args.map((arg, index) => {
          const option = options?.filter(
            (e) => ![11, "Attachment"].includes(e.type as string | number)
          )[index];
          if (option)
            return {
              name: option.name,
              value: arg,
              type:
                typeof option.type == "string"
                  ? ApplicationCommandOptionTypes[option.type]
                  : option.type,
            };
        })
      : []) as result[],
    get(name, required) {
      const res = this.results.find((e) => e.name == name);
      if (!res && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return res?.value;
    },
    getString(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 3);
      if (!res?.value && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return res?.value as string;
    },
    getNumber(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 10);
      if (isNaN(Number(res?.value)) && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      if (data.interaction) return res?.value as number;
      return Number(res!.value);
    },
    getLongString(name, required) {
      if (data.interaction)
        return this.getString(name, required as false) as string;
      const str = data.message?.content.split(" ").splice(1).join(" ");
      if (!str && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return str as string;
    },
    getInteger(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 4);
      if (isNaN(Number(res?.value)) && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      if (data.interaction) return res?.value as number;
      return parseInt(res!.value as string);
    },
    getBoolean(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 5);
      const bool =
        typeof res?.value == "string"
          ? ["yes", "true", "y"].includes(res.value)
            ? true
            : ["n", "no", "false"].includes(res.value)
            ? false
            : undefined
          : (res?.value as boolean | undefined);
      if (bool === undefined && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return bool as boolean;
    },
    async getUser(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 6);
      if (data.interaction && res?.value)
        return (
          res.value
            ? data.interaction.data?.resolved?.users?.get(
                BigInt(res.value as string)
              )
            : undefined
        ) as User;
      const userId =
        typeof res?.value === "string" && res?.value.startsWith("<@")
          ? res.value.substring(
              res.value!.startsWith("<@!") ? 3 : 2,
              res.value.length - 1
            )
          : (res?.value as string);

      let user = bot.cache.users.memory.find((e) => {
        return /^[\d+]{17,}$/.test(userId)
          ? e.id == BigInt(userId as string)
          : e.username == userId ||
              `${e.username}#${e.discriminator}` == userId;
      });
      try {
        if (!user && userId) user = await bot.helpers.getUser(BigInt(userId));
      } catch {}
      if (!user && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }

      return user as User;
    },
    // @ts-ignore satisfy lint
    async getMember(name, { required, force }) {
      const guildId = data.interaction?.guildId || data.message?.guildId;
      if (!guildId)
        throw `${name} is an option only available on guilds, but it was tried to be fetched from DM.`;
      if (data.interaction) {
        const res = this.results.find((e) => e.name == name && e.type == 6);
        return res
          ? data.interaction.data?.resolved?.members?.get(
              BigInt(res.value as string)
            )
          : undefined;
      }
      const user = await this.getUser(name, required as false);
      const member = user
        ? (await bot.cache.members.get(user.id, guildId)) ??
          (force ? await bot.cache.members.get(user.id, guildId) : undefined)
        : undefined;
      if (!member && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return member;
    },
    async getRole(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 8);
      if (!data.interaction?.guildId && !data.message?.guildId)
        throw "This option can only be used in guilds.";
      if (data.interaction)
        return (
          res?.value && data.interaction.data?.resolved?.roles
            ? data.interaction.data?.resolved?.roles?.get(
                BigInt(res.value as string)
              )
            : undefined
        ) as Role;
      if (!res?.value && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      //@ts-ignore
      res.value = res.value.replace("<@&", "").replace(">", "");
      return (
        res?.value
          ? (await bot.cache.guilds.get(data.message!.guildId!))?.roles.find(
              (e) =>
                e.id + "" == res.value ||
                `<@&${res.value}>` == `<@&${e.id}>` ||
                e.name == res.value
            )
          : undefined
      ) as Role;
    },
    async getMentionable(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 9);
      if (data.interaction?.data?.resolved)
        return (
          res?.value
            ? data.interaction.data.resolved.roles?.get(
                BigInt(res.value as string)
              ) ||
              data.interaction.data.resolved.users?.get(
                BigInt(res.value as string)
              )
            : undefined
        ) as Role | User;
      const userOrRoleId =
        typeof res?.value === "string" && res?.value.startsWith("<@")
          ? res.value.substring(
              res.value!.startsWith("<@!") || res.value.startsWith("<@&")
                ? 3
                : 2,
              res.value.length - 1
            )
          : (res?.value as string);
      let returned =
        bot.cache.users.memory.find((e) =>
          /^[\d+]{17,}$/.test(userOrRoleId)
            ? e.id == BigInt(userOrRoleId as string)
            : e.username == userOrRoleId ||
              `${e.username}#${e.discriminator}` == userOrRoleId
        ) ||
        (await bot.cache.guilds.get(data.message!.guildId!))?.roles.find((e) =>
          /^[\d+]{17,}$/.test(userOrRoleId)
            ? e.id == BigInt(userOrRoleId as string)
            : e.name == userOrRoleId
        );
      try {
        if (!returned)
          returned = await bot.helpers.getUser(BigInt(userOrRoleId));
      } catch {}

      if (!returned && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return returned as User | Role;
    },
    getAttachment(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 11);
      if (data.interaction?.data?.resolved?.attachments)
        return data.interaction.data.resolved.attachments.get(
          BigInt(res?.value as string)
        ) as Attachment;
      const attachment = data.message?.attachments
        ? data.message?.attachments[0]
        : undefined;
      if (!attachment && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return attachment as Attachment;
    },
    async getChannel(name, required) {
      const res = this.results.find((e) => e.name == name && e.type == 7);
      if (!data.interaction?.guildId && !data.message?.guildId)
        throw "This option can only be used in guilds.";
      if (data.interaction?.data?.resolved?.channels)
        return (
          res?.value
            ? {
                ...data.interaction.data.resolved.channels.get(
                  BigInt(res.value as string)
                ),
              }
            : undefined
        ) as Channel;
      const channelId =
        typeof res?.value === "string" && res?.value.startsWith("<#")
          ? res.value.substring(2, res.value.length - 1)
          : (res?.value as string);
      let channel = bot.cache.channels.memory.find(
        (e) =>
          e.guildId == data.message?.guildId &&
          (/^[\d+]{17,}$/.test(channelId)
            ? e.id == BigInt(channelId as string)
            : e.name == channelId)
      );
      try {
        if (!channel && channelId)
          channel = await bot.helpers.getChannel(BigInt(channelId));
      } catch {}
      if (!channel && required) {
        const option = options?.find((e) => e.name == name);
        if (option?.missing && data.message)
          option.missing(bot, data.message, name);
        if (bot.events.commandError) {
          bot.events.commandError(
            bot,
            {
              error: {
                type: ErrorEnums.MISSING_REQUIRED_ARGUMENTS,
                value: name,
              },
              message: data.message,
            },
            this.context!
          );
          throw new Error("Not Enough Arguments");
        }
        if (!(option?.missing && data.message) && !bot.events.commandError)
          throw `"${name}" was a required argument that wasn't given.`;
      }
      return channel as Channel;
    },
  };
}
