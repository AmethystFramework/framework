import {
  ActionRow,
  ButtonStyles,
  DiscordMessageComponentTypes,
  SelectOption,
} from "../../deps.ts";

const snowflakeRegex = /[0-9]{17,19}/;

/** A class containing all options for a select menu */
export class SelectMenuOptions extends Array<SelectOption> {
  constructor(...args: SelectOption[]) {
    super(...args);
    return this;
  }
  /** A function that adds an option */
  addOption(
    label: string,
    value: string,
    options?: {
      description?: string;
      default?: boolean;
      emoji?: string | bigint;
    }
  ) {
    // Don't add the option if it exceeds 25 options.
    if (this.length === 25) return this;

    this.push({
      default: options?.default ? options.default : false,
      label,
      value,
      emoji: this.stringToEmoji(options?.emoji),
      description: options?.description,
    });
    return this;
  }

  /** Convert a string to emoji */
  stringToEmoji(emoji?: string | bigint) {
    if (!emoji) return;

    emoji = emoji.toString();

    // A snowflake id was provided
    if (snowflakeRegex.test(emoji)) {
      return {
        id: emoji.match(snowflakeRegex)![0],
      };
    }

    // A unicode emoji was provided
    return {
      name: emoji,
    };
  }
}

/** A class to add components to use in a message */
export class AmethystComponents extends Array<ActionRow> {
  constructor(...args: ActionRow[]) {
    super(...args);

    return this;
  }

  /** Add an action row */
  addActionRow() {
    // Don't allow more than 5 Action Rows
    if (this.length === 5) return this;

    this.push({
      type: 1,
      components: [] as unknown as ActionRow["components"],
    });
    return this;
  }

  /** Add a select menu to the components */
  addSelectMenu(
    id: string,
    options: SelectOption[],
    other?: { min_values?: number; max_values?: number; placeholder?: string }
  ) {
    // No Action Row has been created so do it
    if (!this.length) this.addActionRow();

    // Get the last Action Row
    let row = this[this.length - 1];

    // If the Action Row already has a select menu create a new one
    if (row.components.length) {
      this.addActionRow();
      row = this[this.length - 1];

      // Apperandly there are already 5 Full Action Rows so don't add the select menu
      if (row.components.length) return this;
    }
    // deno-lint-ignore no-explicit-any
    (row.components as any).push({
      ...other,
      type: DiscordMessageComponentTypes.SelectMenu,
      customId: id,
      options: options,
    });
    return this;
  }

  /** Add a button to the components */
  addButton(
    label: string,
    style: keyof typeof ButtonStyles,
    idOrLink: string,
    options?: { emoji?: string | bigint; disabled?: boolean }
  ) {
    // No Action Row has been created so do it
    if (!this.length) this.addActionRow();

    // Get the last Action Row
    let row = this[this.length - 1];

    // If the Action Row already has 5 buttons create a new one
    if (
      row.components.length === 5 ||
      row.components.find(
        (e) => e.type === DiscordMessageComponentTypes.SelectMenu
      )
    ) {
      this.addActionRow();
      row = this[this.length - 1];

      // Apperandly there are already 5 Full Action Rows so don't add the button
      if (
        row.components.length === 5 ||
        row.components.find(
          (e) => e.type === DiscordMessageComponentTypes.SelectMenu
        )
      )
        return this;
    }

    row.components.push({
      type: DiscordMessageComponentTypes.Button,
      label: label,
      customId: style !== "Link" ? idOrLink : undefined,
      style: ButtonStyles[style],
      emoji: this.stringToEmoji(options?.emoji),
      url: style === "Link" ? idOrLink : undefined,
      disabled: options?.disabled,
    });
    return this;
  }

  /** A functions that converts a string to emoji */
  stringToEmoji(emoji?: string | bigint) {
    if (!emoji) return;

    emoji = emoji.toString();

    // A snowflake id was provided
    if (snowflakeRegex.test(emoji)) {
      return {
        id: emoji.match(snowflakeRegex)![0],
      };
    }

    // A unicode emoji was provided
    return {
      name: emoji,
    };
  }
}
