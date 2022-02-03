import {
  BotWithCache,
  DiscordenoInteraction,
  DiscordenoMessage,
  EventHandlers,
} from "../../deps.ts";
import { AmethystCollection } from "../utils/AmethystCollection.ts";
import { Async } from "../utils/types.ts";
import { Argument, ArgumentDefinition } from "./arguments.ts";
import {
  BaseCommand,
  CommandCooldown,
  MessageCommand,
  SlashCommand,
  SlashSubcommand,
  SlashSubcommandGroup,
} from "./command.ts";
import { AmethystError } from "./errors.ts";
import { AmethystTask } from "./tasks.ts";

interface runningTasks {
  initialTimeouts: number[];
  intervals: number[];
}

/**An extended version of BotWithCache with a command handler and extra utils*/
export type AmethystBot<B extends BotWithCache = BotWithCache> = B &
  AmethystProps & { utils: AmethystUtils };

export interface AmethystEvents extends EventHandlers {
  commandError(
    bot: AmethystBot,
    data: {
      error: AmethystError;
      data?: DiscordenoInteraction;
      message?: DiscordenoMessage;
    }
  ): unknown;
  commandStart<E extends BaseCommand = BaseCommand>(
    bot: AmethystBot,
    command: E,
    dataOrMessage: DiscordenoInteraction | DiscordenoMessage
  ): unknown;
  commandEnd<E extends BaseCommand = BaseCommand>(
    bot: AmethystBot,
    command: E,
    dataOrMessage: DiscordenoInteraction | DiscordenoMessage
  ): unknown;
}

interface AmethystUtils {
  createMessageCommand<T extends readonly ArgumentDefinition[]>(
    command: MessageCommand<T>
  ): void;
  createMessageSubcommand<T extends readonly ArgumentDefinition[]>(
    command: string,
    subcommand: Omit<MessageCommand<T>, "category">,
    retries?: number
  ): void;
  createSlashCommand(command: SlashCommand): void;
  createSlashSubcommandGroup(
    command: string,
    subcommandGroup: SlashSubcommandGroup,
    retries?: number
  ): void;
  createSlashSubcommand(
    command: string,
    subcommandGroup: SlashSubcommand,
    options?: { split?: boolean; retries?: number }
  ): void;
  createTask(task: AmethystTask): void;
  clearTasks(): void;
  createInhibitor<T extends BaseCommand = BaseCommand>(
    name: string,
    inhibitor: (
      bot: AmethystBot,
      command: T,
      options?: { memberId?: bigint; guildId?: bigint; channelId: bigint }
    ) => true | AmethystError
  ): void;
  deleteInhibitor(name: string): void;
}

interface AmethystProps extends BotWithCache {
  events: AmethystEvents;
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
      options: { memberId?: bigint; channelId: bigint; guildId?: bigint }
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
    | ((
        bot: AmethystBot,
        message: DiscordenoMessage
      ) => Async<string | string[]>);
}
