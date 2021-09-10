import { Argument } from "../structures/Argument.ts";

export const multiStringArgument: Argument<string> = {
  name: "...string",
  execute: (data) => {
    return data.parameters.join(" ");
  },
};
