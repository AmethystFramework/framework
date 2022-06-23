import { RecAsyncGen } from "./types.ts";

interface Module extends Record<string, unknown> {
  default?: unknown;
}

export async function* load<T extends Module>(dir: string): RecAsyncGen<T> {
  for await (const file of Deno.readDir(dir)) {
    if (file.isDirectory) {
      yield* load(`${dir}/${file.name}`);
      continue;
    }
    const module = await import(`${dir}/${file.name}`);
    yield module as T;
  }
}
