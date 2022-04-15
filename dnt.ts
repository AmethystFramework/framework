import { build } from "https://deno.land/x/dnt@0.17.0/mod.ts";

await Deno.remove("npm", { recursive: true }).catch((_) => {});

await build({
  shims: {
    deno: true,
    timers: true,
    custom: [
      {
        package: {
          name: "ws",
          version: "^8.4.0",
        },
        globalNames: [
          {
            name: "WebSocket",
            exportName: "default",
          },
        ],
      },
    ],
  },
  package: {
    author: "some-boi",
    name: "amethyst-framework",
    version: Deno.args[0],
    description: "Amethyst is a powerful and flexible Discordeno framework.",
    repository: {
      type: "git",
      url: "git+https://github.com/AmethystFramework/framework.git",
    },
    bugs: {
      url: "https://github.com/AmethystFramework/framework/issues",
    },
    typesVersions: {
      "*": {
        "*": ["./types/mod.d.ts"],
      },
    },
  },
  entryPoints: ["./mod.ts"],
  mappings: {
    "https://deno.land/x/discordeno@13.0.0-rc35/mod.ts": {
      name: "discordeno",
      version: "13.0.0-rc35",
    },
  },
  outDir: "./npm",
  declaration: true,
  typeCheck: false,
  test: false,
});

// post build steps
Deno.copyFileSync("README.md", "npm/README.md");
