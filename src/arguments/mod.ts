import { ChannelTypes } from "../../deps.ts";
import { Argument } from "../interfaces/arguments.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";

export const commandArguments = new AmethystCollection<string, Argument>();

commandArguments.set("...roles", {
  name: "...roles",
  execute: function (bot, _argument, parameters, message) {
    if (!parameters.length || !message.guildId) return;

    const guild = bot.guilds.get(message.guildId);
    if (!guild) return;

    return parameters.map((word) => {
      const roleIdOrName = word.startsWith("<@&")
        ? word.substring(3, word.length - 1)
        : word.toLowerCase();

      const role = /^[\d+]{17,}$/.test(roleIdOrName)
        ? guild.roles.get(bot.utils.snowflakeToBigint(roleIdOrName))
        : guild.roles.find((r) => r.name.toLowerCase() === roleIdOrName);
      if (role) return role;
    });
  },
});

commandArguments.set("...strings", {
  name: "...strings",
  execute: function (_, argument, parameters) {
    if (!parameters.length) return;

    return argument.lowercase
      ? parameters.join(" ").toLowerCase()
      : parameters.join(" ");
  },
});

commandArguments.set("categorychannel", {
  name: "categorychannel",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const channelIdOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();

    const channel = /^[\d+]{17,}$/.test(channelIdOrName)
      ? bot.channels.get(bot.utils.snowflakeToBigint(channelIdOrName))
      : bot.channels.find(
          (channel) =>
            channel.name === channelIdOrName &&
            channel.guildId === message.guildId
        );

    if (channel?.type !== ChannelTypes.GuildCategory) return;

    return channel;
  },
});

const textChannelTypes = [
  ChannelTypes.GuildText,
  ChannelTypes.GuildNews,
  ChannelTypes.GuildNewsThread,
  ChannelTypes.GuildPrivateThread,
  ChannelTypes.GuildPublicThread,
];
commandArguments.set("guildtextchannel", {
  name: "guildtextchannel",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const channelIdOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();

    const channel = /^[\d+]{17,}$/.test(channelIdOrName)
      ? bot.channels.get(bot.utils.snowflakeToBigint(channelIdOrName))
      : bot.channels.find(
          (channel) =>
            channel.name === channelIdOrName &&
            channel.guildId === message.guildId
        );

    if (
      channel?.type === undefined ||
      !textChannelTypes.includes(channel.type)
    ) {
      return;
    }

    return channel;
  },
});

commandArguments.set("member", {
  name: "member",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const userId = id.startsWith("<@")
      ? id.substring(id.startsWith("<@!") ? 3 : 2, id.length - 1)
      : id;

    if (/^[\d+]{17,}$/.test(userId)) {
      const cachedMember = bot.members.get(
        bot.transformers.snowflake(`${userId}${message.guildId}`)
      );
      if (cachedMember) return cachedMember;
    }

    const cached = bot.members.find(
      (member) =>
        member.guildId == message.guildId &&
        `${bot.users.get(member.id)?.username}#${
          bot.users.get(member.id)?.discriminator
        }`
          .toLowerCase()
          .startsWith(userId.toLowerCase())
    );
    return cached;
  },
});

commandArguments.set("number", {
  name: "number",
  execute: function (_, argument, parameters) {
    const [number] = parameters;

    const valid = Number(number);
    if (!valid) return;

    if (valid < (argument.minimum || 0)) return;
    if (argument.maximum && valid > argument.maximum) return;
    if (!argument.allowDecimals) return Math.floor(valid);

    if (valid) return valid;
  },
});

commandArguments.set("role", {
  name: "role",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const guild = bot.guilds.get(message.guildId);
    if (!guild) return;

    const roleIdOrName = id.startsWith("<@&")
      ? id.substring(3, id.length - 1)
      : id.toLowerCase();

    const role = /^[\d+]{17,}$/.test(roleIdOrName)
      ? guild.roles.get(bot.utils.snowflakeToBigint(roleIdOrName))
      : guild.roles.find((r) => r.name.toLowerCase() === roleIdOrName);
    if (role) return role;
  },
});

commandArguments.set("string", {
  name: "string",
  execute: function (_, argument, parameters) {
    const [text] = parameters;

    const valid =
      // If the argument required literals and some string was provided by user
      argument.literals?.length && text
        ? argument.literals.includes(text.toLowerCase())
          ? text
          : undefined
        : text;

    if (valid) {
      return argument.lowercase ? valid.toLowerCase() : valid;
    }
  },
});

commandArguments.set("subcommand", {
  name: "subcommand",
  execute: function (_, argument, parameters, _message, command) {
    const [subcommandName] = parameters;

    const sub = command.subcommands?.find(
      (sub) =>
        sub.name === subcommandName ||
        Boolean(sub.aliases?.includes(subcommandName))
    );
    if (sub) return sub;

    return typeof argument.defaultValue === "string"
      ? command.subcommands?.get(argument.defaultValue)
      : undefined;
  },
});

commandArguments.set("textchannel", {
  name: "textchannel",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const channelIdOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();

    const channel = /^[\d+]{17,}$/.test(channelIdOrName)
      ? bot.channels.get(bot.utils.snowflakeToBigint(channelIdOrName))
      : bot.channels.find(
          (channel) =>
            channel.name === channelIdOrName &&
            channel.guildId === message.guildId
        );

    if (channel?.type !== ChannelTypes.GuildText) return;

    return channel;
  },
});

commandArguments.set("voicechannel", {
  name: "voicechannel",
  execute: function (bot, _argument, parameters, message) {
    const [id] = parameters;
    if (!id || !message.guildId) return;

    const channelIdOrName = id.startsWith("<#")
      ? id.substring(2, id.length - 1)
      : id.toLowerCase();

    const channel = /^[\d+]{17,}$/.test(channelIdOrName)
      ? bot.channels.get(bot.utils.snowflakeToBigint(channelIdOrName))
      : bot.channels.find(
          (channel) =>
            channel.name === channelIdOrName &&
            channel.guildId === message.guildId
        );

    if (
      channel?.type !== ChannelTypes.GuildVoice &&
      channel?.type !== ChannelTypes.GuildStageVoice
    ) {
      return;
    }

    return channel;
  },
});
