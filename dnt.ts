import { build } from "https://deno.land/x/dnt@0.30.0/mod.ts";

await Deno.remove("npm", { recursive: true }).catch((_) => {});

await build({
  shims: {
    deno: true,
    timers: true,
  },
  package: {
    author: "some-boi",
    name: "@thereallonewolf/amethystframework",
    version: "v4.1.0",
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
    "https://deno.land/x/discordeno@16.0.0/mod.ts": {
      name: "discordeno",
      version: "16.0.0",
    },
  },
  outDir: "./npm",
  declaration: true,
  typeCheck: false,
  test: false,
});

// post build steps
Deno.copyFileSync("README.md", "npm/README.md");
