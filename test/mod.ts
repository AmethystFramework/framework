import { CommandClient } from "../mod.ts";
import { configs } from "./config.ts";

const client = new CommandClient({
  prefix: "!",
  token: configs.token,
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
  ownerIds: [414094066339414019n],
});

client.eventHandlers.commandAdd = (command) => {
  console.log(`Successfuly loaded ${command.name}`);
};

client.eventHandlers.commandStart = (command) => {
  console.log(`executing ${command.name}`);
};

client.eventHandlers.ready = () => {
  console.log(`Successfuly loaded ${client.commands.size} commands`);
  console.log(
    `Successfuly loaded ${Object.keys(client.eventHandlers).length} events`
  );
  console.log(`Successfuly connected or smth`);
};

client.eventHandlers.commandFail = (_, error) => {
  console.error(error);
};

client.addCommand({
  name: "epic",
  category: "lol",
  userServerPermissions: ["MANAGE_ROLES"],
  guildOnly: true,
  execute: (ctx) => {
    ctx.message.send("kek");
  },
});

client.start();
