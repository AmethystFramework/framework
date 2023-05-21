import { build } from "https://deno.land/x/dnt@0.35.0/mod.ts";

await Deno.remove("npm", { recursive: true }).catch((_) => {});

await build({
  shims: {
    deno: true,
    timers: true,
  },
  package: {
    author: "some-boi",
    name: "@thereallonewolf/amethystframework",
    version: "v8.0.2",
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
  outDir: "./npm",
  declaration: true,
  typeCheck: false,
  test: false,
});

// post build steps
Deno.copyFileSync("README.md", "npm/README.md");
