import { Cooldown } from "./cooldown";


export type BotOptions = {
    owners?: (bigint | string)[];
    prefix?:
    | string
    | string[]
    | ((bot:any, message:any) => PromiseLike<string | string[]>);
    botMentionAsPrefix?: boolean;
    /**ignore bots when they try to use message commands, default to `true`*/
    ignoreBots?: boolean;
    defaultCooldown?: Cooldown;
    ignoreCooldown?: (string | bigint)[];
    dir?: string;
    prefixCaseSensitive?: boolean;
}