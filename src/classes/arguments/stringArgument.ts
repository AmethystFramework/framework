import { Argument } from "../mod.ts";

export const stringArgument: Argument<string> = {
  name: "string",
  execute: (data) => {
    return data.parameters[0];
  },
};
