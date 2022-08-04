import { BotWithCache, Interaction, Message } from "../../deps.ts";
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
import {
  Command,
  CommandCooldown,
  subcommand,
  subcommandGroup,
} from "./command.ts";
import { AmethystError } from "./errors.ts";
import { AmethystEvents } from "./event.ts";
import { AmethystTask } from "./tasks.ts";

interface runningTasks {
  initialTimeouts: number[];
  intervals: number[];
}

/**An extended version of BotWithCache with a command handler and extra utils*/
export type AmethystBot<
  B extends Omit<BotWithCache, "events"> = Omit<BotWithCache, "events">
> = B & AmethystProps & { utils: AmethystUtils };

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
  createSubcommandGroup(
    command: string,
    subcommandGroup: subcommandGroup,
    retries?: number
  ): void;
  createSubcommand(
    command: string,
    subcommandGroup: subcommand,
    options?: { split?: boolean; retries?: number }
  ): void;
  createCommand(command: Command): void;
  createTask(task: AmethystTask): void;
  clearTasks(): void;
  createInhibitor<T extends Command = Command>(
    name: string,
    inhibitor: (
      bot: AmethystBot,
      command: T,
      options?: { memberId?: bigint; guildId?: bigint; channelId: bigint }
    ) => true | AmethystError
  ): void;
  deleteInhibitor(name: string): void;
}

interface AmethystProps extends Omit<BotWithCache, "events"> {
  events: AmethystEvents;
  messageCollectors: AmethystCollection<string, MessageCollector>;
  componentCollectors: AmethystCollection<bigint, ComponentCollector>;
  reactionCollectors: AmethystCollection<bigint, ReactionCollector>;
  runningTasks: runningTasks;
  tasks: AmethystCollection<string, AmethystTask>;
  commands: AmethystCollection<string, Command>;
  inhibitors: AmethystCollection<
    string,
    <T extends Command = Command>(
      bot: AmethystBot,
      command: T,
      options: { memberId?: bigint; channelId: bigint; guildId?: bigint }
    ) => true | AmethystError
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
  prefix?:
    | string
    | string[]
    | ((bot: AmethystBot, message: Message) => Async<string | string[]>);
}
