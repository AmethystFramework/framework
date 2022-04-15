import { Interaction, Message } from "../../deps.ts";
import { AmethystBot } from "../../mod.ts";
import {
  MessageCollectorOptions,
  CollectMessagesOptions,
  ComponentCollectorOptions,
  CollectComponentsOptions,
  ReactionCollectorOptions,
  CollectReactionsOptions,
  AmethystReaction,
} from "../interfaces/collectors.ts";

// Component collectors
export async function awaitComponent(
  bot: AmethystBot,
  messageId: bigint,
  options?: ComponentCollectorOptions & { maxUsage?: 1 }
): Promise<Interaction>;
export async function awaitComponent(
  bot: AmethystBot,
  messageId: bigint,
  options?: ComponentCollectorOptions & { maxUsage?: number }
): Promise<Interaction[]>;
export async function awaitComponent(
  bot: AmethystBot,
  messageId: bigint,
  options?: ComponentCollectorOptions
): Promise<Interaction>;
export async function awaitComponent(
  bot: AmethystBot,
  messageId: bigint,
  options?: ComponentCollectorOptions
) {
  const interactions = await collectComponents(bot, {
    key: messageId,
    createdAt: Date.now(),
    filter: options?.filter || (() => true),
    maxUsage: options?.maxUsage || 1,
    timeout: options?.timeout || 1000 * 60 * 15,
  });
  return (options?.maxUsage || 1) > 1 ? interactions : interactions[0];
}

function collectComponents(
  bot: AmethystBot,
  options: CollectComponentsOptions
): Promise<Interaction[]> {
  return new Promise((resolve, reject) => {
    bot.componentCollectors
      .get(options.key)
      ?.reject(
        "A new collector began before the user responded to the previous one."
      );

    bot.componentCollectors.set(options.key, {
      ...options,
      components: [],
      resolve,
      reject,
    });
  });
}

// Reaction collector
export async function awaitReaction(
  bot: AmethystBot,
  messageId: bigint,
  options?: ReactionCollectorOptions & { maxUsage?: 1 }
): Promise<AmethystReaction>;
export async function awaitReaction(
  bot: AmethystBot,
  messageId: bigint,
  options?: ReactionCollectorOptions & { maxUsage?: number }
): Promise<AmethystReaction[]>;
export async function awaitReaction(
  bot: AmethystBot,
  messageId: bigint,
  options?: ReactionCollectorOptions
): Promise<AmethystReaction>;
export async function awaitReaction(
  bot: AmethystBot,
  messageId: bigint,
  options?: ReactionCollectorOptions
) {
  const reactions = await collectReactions(bot, {
    key: messageId,
    createdAt: Date.now(),
    filter: options?.filter || (() => true),
    maxUsage: options?.maxUsage || 1,
    timeout: options?.timeout || 1000 * 60 * 15,
  });
  return (options?.maxUsage || 1) > 1 ? reactions : reactions[0];
}

function collectReactions(
  bot: AmethystBot,
  options: CollectReactionsOptions
): Promise<AmethystReaction[]> {
  return new Promise((resolve, reject) => {
    bot.reactionCollectors
      .get(options.key)
      ?.reject(
        "A new collector began before the user responded to the previous one."
      );

    bot.reactionCollectors.set(options.key, {
      ...options,
      reactions: [],
      resolve,
      reject,
    });
  });
}

// Message collector
export async function awaitMessage(
  bot: AmethystBot,
  memberId: bigint,
  channelId: bigint,
  options?: MessageCollectorOptions & { maxUsage?: 1 }
): Promise<Message>;
export async function awaitMessage(
  bot: AmethystBot,
  memberId: bigint,
  channelId: bigint,
  options?: MessageCollectorOptions & { maxUsage?: number }
): Promise<Message[]>;
export async function awaitMessage(
  bot: AmethystBot,
  memberId: bigint,
  channelId: bigint,
  options?: MessageCollectorOptions
): Promise<Message>;
export async function awaitMessage(
  bot: AmethystBot,
  memberId: bigint,
  channelId: bigint,
  options?: MessageCollectorOptions
) {
  const messages = await collectMessages(bot, {
    key: `${memberId}-${channelId}`,
    channelId,
    createdAt: Date.now(),
    filter: options?.filter || (() => true),
    maxUsage: options?.maxUsage || 1,
    timeout: options?.timeout || 1000 * 60 * 15,
  });
  return (options?.maxUsage || 1) > 1 ? messages : messages[0];
}

function collectMessages(
  bot: AmethystBot,
  options: CollectMessagesOptions
): Promise<Message[]> {
  return new Promise((resolve, reject) => {
    bot.messageCollectors
      .get(options.key)
      ?.reject(
        "A new collector began before the user responded to the previous one."
      );

    bot.messageCollectors.set(options.key, {
      ...options,
      messages: [],
      resolve,
      reject,
    });
  });
}
