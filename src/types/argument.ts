import { DiscordenoMessage } from "../../deps.ts";
import { Awaited } from "../utils/mod.ts";

// deno-lint-ignore no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type Identity<T> = { [P in keyof T]: T[P] };

type BaseDefinition = {
  /** The argument name */
  name: string;
  /** If is the argument required */
  required: boolean;
  /** The function that executes if the argument wasn't given */
  missing?: (message: DiscordenoMessage) => Awaited<unknown>;
};

type StringArgumentDefinition<N extends string = string> = BaseDefinition & {
  name: N;
  type: "string" | "...string";
};

type StringOptionalArgumentDefinition<N extends string = string> =
  BaseDefinition & {
    name: N;
    type: "string" | "...string";
    defaultValue?: string;
    required: false;
  };

export type ArgumentDefinition =
  | StringArgumentDefinition
  | StringOptionalArgumentDefinition;

export type ConvertArgumentDefinitionsToArgs<
  T extends readonly ArgumentDefinition[]
> = Identity<
  UnionToIntersection<
    {
      [P in keyof T]: T[P] extends StringOptionalArgumentDefinition<infer N>
        ? { [_ in N]?: string }
        : T[P] extends StringArgumentDefinition<infer N>
        ? { [_ in N]: string }
        : never;
    }[number]
  >
>;
