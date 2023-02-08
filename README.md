# Amethyst

Amethyst is a [Discordeno](https://github.com/discordeno/discordeno) framework that is incredibly robust and flexible.
It promotes standard practices and is geared at bigger bots.

## Installation

```bash
npm i @thereallonewolf/amethystframework
```

## Features

- Thanks to Amethyst's adaptability, you can change a lot of things and add features as you see appropriate.
- A developer may create slash or message interactions with Amethyst.
- Assistance with interactions, such as selection, built-in buttons, and more.
- Explore more incredible features of our framework.

## Why Amethyst?

Amethyst utilizes Decorators to help you keep readability and simplify your code. Support for message and slash commands without requiring code rewriting.

- Completely programmable.
- Simple to use and learn.

## Usage

```typescript
import { createBot, GatewayIntents, startBot } from "discordeno";
import { enableCachePlugin, enableCacheSweepers } from "discordeno/cache-plugin";
import {
  AmethystBot,
  Category,
  Command,
  Context,
  enableAmethystPlugin,
  Event,
} from "@thereallonewolf/amethystframework";

let baseClient = createBot({
  token: "TOKEN",
  intents: GatewayIntents.Guilds | GatewayIntents.GuildMessages | GatewayIntents.MessageContent,
});

//@ts-ignore
let client = enableAmethystPlugin(enableCachePlugin(baseClient), {
  botMentionAsPrefix: true,
  prefix: "!", //Can be a function or a string.
  ignoreBots: false,
});
enableCacheSweepers(client);

startBot(client);

@Category({
  name: "general",
  description: "My general commands",
  uniqueCommands: true,
  default: "", //As all the commands are unique so no need to set the default command.
})
export class General {
  @Command({
    name: "ping",
    description: "Pong!",
    commandType: ["application", "message"],
    category: "general",
    args: [],
  })
  async ping(bot: AmethystBot, ctx: Context) {
    ctx.reply({ content: "Pong!" });
  }

  @Event("ready")
  async ready() {
    console.log("I am ready!");
    client.amethystUtils.updateSlashCommands();
  }
}
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
