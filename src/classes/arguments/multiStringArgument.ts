import { Argument } from "../mod.ts";

export const multiStringArgument: Argument<string> = {
  name: "...string",
  execute: (data) => {
    return data.parameters.join(" ");
  },
};
