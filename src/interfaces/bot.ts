import { Bot, Interaction, Message, User } from "../../deps.ts";
import { BotWithProxyCache, ProxyCacheTypes } from "../cache-with-proxy/mod.ts";
import { AmethystEventHandler } from "../classes/AmethystEvents.ts";
import CategoryClass from "../classes/Category.ts";
import { CommandClass } from "../classes/Command.ts";
import { Context } from "../classes/Context.ts";
import { CategoryOptions } from "../types/categoryOptions.ts";
import { CommandOptions } from "../types/commandOptions.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";
import { Async } from "../utils/types.ts";
import {
  AmethystReaction,
  ComponentCollector,
  ComponentCollectorOptions,
  MessageCollector,
  MessageCollectorOptions,
  ReactionCollector,
  ReactionCollectorOptions,
} from "./collectors.ts";
import { CommandCooldown } from "./command.ts";
import { AmethystError } from "./errors.ts";
import { AmethystEvents } from "./event.ts";
import { AmethystTask } from "./tasks.ts";

interface runningTasks {
  initialTimeouts: number[];
  intervals: number[];
}

/**An extended version of BotWithCache with a command handler and extra utils*/
export type AmethystBot<
  B extends Omit<BotWithProxyCache<ProxyCacheTypes, Bot>, "events"> = Omit<
    BotWithProxyCache<ProxyCacheTypes, Bot>,
    "events"
  >
> = B & AmethystProps & { utils: AmethystUtils };

/* It's defining a new interface called `AmethystUtils` */
interface AmethystUtils {
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions & { maxUsage?: 1 }
  ): Promise<Interaction>;
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions & { maxUsage?: number }
  ): Promise<Interaction[]>;
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions
  ): Promise<Interaction>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions & { maxUsage?: 1 }
  ): Promise<AmethystReaction>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions & { maxUsage?: number }
  ): Promise<AmethystReaction[]>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions
  ): Promise<AmethystReaction>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions & { maxUsage?: 1 }
  ): Promise<Message>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions & { maxUsage?: number }
  ): Promise<Message[]>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions
  ): Promise<Message>;
  createCommand(command: CommandOptions): void;
  createCategory(category: CategoryOptions): void;
  updateCategory(category: CategoryOptions): void;
  createTask(task: AmethystTask): void;
  clearTasks(): void;
  createInhibitor<T extends CommandClass = CommandClass>(
    name: string,
    inhibitor: (
      bot: AmethystBot,
      command: T,
      options?: Context
    ) => Promise<true | AmethystError>
  ): void;
  deleteInhibitor(name: string): void;
  updateSlashCommands(): void;
}

/* Extending the BotWithCache interface and removing the events property. */
interface AmethystProps
  extends Omit<BotWithProxyCache<ProxyCacheTypes, Bot>, "events"> {
  user: User;
  events: AmethystEvents;
  messageCollectors: AmethystCollection<string, MessageCollector>;
  componentCollectors: AmethystCollection<bigint, ComponentCollector>;
  reactionCollectors: AmethystCollection<bigint, ReactionCollector>;
  runningTasks: runningTasks;
  tasks: AmethystCollection<string, AmethystTask>;
  category: AmethystCollection<string, CategoryClass>;
  inhibitors: AmethystCollection<
    string,
    <T extends CommandClass = CommandClass>(
      bot: AmethystBot,
      command: T,
      options: Context
    ) => Promise<true | AmethystError>
  >;
  owners?: bigint[];
  botMentionAsPrefix?: boolean;
  prefixCaseSensitive?: boolean;
  defaultCooldown?: CommandCooldown;
  ignoreCooldown?: bigint[];
  guildOnly?: boolean;
  messageQuotedArguments?: boolean;
  ignoreBots?: boolean;
  dmOnly?: boolean;
  eventHandler: AmethystEventHandler;
  extras: any;
  prefix?:
    | string
    | string[]
    | ((bot: AmethystBot, message: Message) => Async<string | string[]>);

  on(name: string, callback: (...args: any) => unknown): void;
  once(name: string, callback: (...args: any) => unknown): void;
  emit(name: string, ...args: any[]): void;
}
