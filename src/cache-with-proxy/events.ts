import {
  Bot,
  Channel,
  EventHandlers,
  Guild,
  Member,
  Message,
  Role,
  User,
} from "../../deps.ts";
import { BotWithProxyCache, ProxyCacheTypes } from "./mod.ts";

export type Events = {
  [K in keyof EventHandlers]: EventHandlers[K] extends (
    bot: infer T,
    ...rest: infer R
  ) => infer U
    ? Bot extends T
      ? (bot: Bot, ...rest: R) => U
      : (...rest: Parameters<EventHandlers[K]>) => U
    : never;
};

export interface BotWithProxyEvents extends Events {
  channelUpdateWithOldChannel(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldChannel: Channel,
    newChannel: Channel
  ): unknown;
  messageUpdateWithOldMessage(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldChannel: Message,
    newChannel: Message
  ): unknown;
  guildUpdateWithOldGuild(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldChannel: Guild,
    newChannel: Guild
  ): unknown;
  guildRoleUpdateWithOldRole(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldRole: Role,
    newRole: Role
  ): unknown;
  guildMemberUpdateWithOldMember(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldMember: Member,
    newMember: Member
  ): unknown;
  userUpdateWithOldUser(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    oldUser: User,
    newUser: User
  ): unknown;
  guildDeleteWithOldGuild(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    guild: Guild
  ): unknown;
  memberDeleteWithOldMember(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    member: Member
  ): unknown;
  channelDeleteWithOldChannel(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    channel: Channel
  ): unknown;
  messageDeleteWithOldMessage(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    message: Message
  ): unknown;
  roleDeleteWithOldRole(
    bot: BotWithProxyCache<ProxyCacheTypes, Bot>,
    role: Role
  ): unknown;
}
