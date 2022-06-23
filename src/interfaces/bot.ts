import { BotWithCache, Interaction, Message } from "../../deps.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";
import { Async } from "../utils/types.ts";
import { Argument, ArgumentDefinition } from "./arguments.ts";
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
  BaseCommand,
  CommandCooldown,
  MessageCommand,
  SlashCommand,
  SlashSubcommand,
  SlashSubcommandGroup,
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
  B extends Omit<BotWithCache, "events"> = Omit<BotWithCache, "events">,
> =
  & B
  & AmethystProps
  & { utils: AmethystUtils };

interface AmethystUtils {
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions & { maxUsage?: 1 },
  ): Promise<Interaction>;
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions & { maxUsage?: number },
  ): Promise<Interaction[]>;
  awaitComponent(
    messageId: bigint,
    options?: ComponentCollectorOptions,
  ): Promise<Interaction>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions & { maxUsage?: 1 },
  ): Promise<AmethystReaction>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions & { maxUsage?: number },
  ): Promise<AmethystReaction[]>;
  awaitReaction(
    messageId: bigint,
    options?: ReactionCollectorOptions,
  ): Promise<AmethystReaction>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions & { maxUsage?: 1 },
  ): Promise<Message>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions & { maxUsage?: number },
  ): Promise<Message[]>;
  awaitMessage(
    memberId: bigint,
    channelId: bigint,
    options?: MessageCollectorOptions,
  ): Promise<Message>;
  createMessageCommand<T extends readonly ArgumentDefinition[]>(
    command: MessageCommand<T>,
  ): void;
  createMessageSubcommand<T extends readonly ArgumentDefinition[]>(
    command: string,
    subcommand: Omit<MessageCommand<T>, "category">,
    retries?: number,
  ): void;
  createSlashCommand(command: SlashCommand): void;
  createSlashSubcommandGroup(
    command: string,
    subcommandGroup: SlashSubcommandGroup,
    retries?: number,
  ): void;
  createSlashSubcommand(
    command: string,
    subcommandGroup: SlashSubcommand,
    options?: { split?: boolean; retries?: number },
  ): void;
  createTask(task: AmethystTask): void;
  clearTasks(): void;
  createInhibitor<T extends BaseCommand = BaseCommand>(
    name: string,
    inhibitor: (
      bot: AmethystBot,
      command: T,
      options?: { memberId?: bigint; guildId?: bigint; channelId: bigint },
    ) => true | AmethystError,
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
  slashCommands: AmethystCollection<string, SlashCommand>;
  // deno-lint-ignore no-explicit-any
  messageCommands: AmethystCollection<string, MessageCommand<any>>;
  inhibitors: AmethystCollection<
    string,
    <T extends BaseCommand = BaseCommand>(
      bot: AmethystBot,
      command: T,
      options: { memberId?: bigint; channelId: bigint; guildId?: bigint },
    ) => true | AmethystError
  >;
  owners?: bigint[];
  botMentionAsPrefix?: boolean;
  defaultCooldown?: CommandCooldown;
  ignoreCooldown?: bigint[];
  arguments?: AmethystCollection<string, Argument>;
  guildOnly?: boolean;
  dmOnly?: boolean;
  prefix?:
    | string
    | string[]
    | ((bot: AmethystBot, message: Message) => Async<string | string[]>);
}
