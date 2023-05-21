import { ActionRow, ButtonStyles, SelectOption } from "../../deps.ts";

const snowflakeRegex = /[0-9]{17,19}/;

/* It's an array of Action Rows that has a few methods to add Action Rows and Buttons */
export class Components extends Array<ActionRow> {
  constructor(...args: ActionRow[]) {
    super(...args);

    return this;
  }

  /**
   * Don't allow more than 5 Action Rows
   * @returns The array itself.
   */
  addActionRow() {
    // Don't allow more than 5 Action Rows
    if (this.length === 5) return this;

    this.push({
      type: 1,
      components: [] as unknown as ActionRow["components"],
    });
    return this;
  }

  addSelectComponent(
    label: string,
    customId: string,
    options: SelectOption[],
    placeholder?: string,
    minValues?: number,
    maxValues?: number,
    disabled?: boolean
  ) {
    if (options.length > 25)
      throw new Error("SelectComponent Cannot have more than 25 options");
    this.addActionRow();
    let row = this[this.length - 1];

    row.components = [
      {
        type: 3,

        customId,
        options,
        placeholder,
        minValues,
        maxValues,
        disabled,
      },
    ];
  }
  /**
   * If the last Action Row has 5 buttons, create a new one, otherwise add the button to the last
   * Action Row
   * @param {string} label - The text that will be displayed on the button
   * @param style - keyof typeof ButtonStyles,
   * @param {string} idOrLink - The ID of the button or the URL of the link
   * @param [options] - { emoji?: string | bigint; disabled?: boolean }
   * @returns The object itself.
   */
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
    if (row.components.length === 5) {
      this.addActionRow();
      row = this[this.length - 1];

      // Apparently there are already 5 Full Action Rows so don't add the button
      if (row.components.length === 5) return this;
    }

    row.components.push({
      type: 2,
      label: label,
      customId: style !== "Link" ? idOrLink : undefined,
      style: ButtonStyles[style],
      emoji: this.#stringToEmoji(options?.emoji),
      url: style === "Link" ? idOrLink : undefined,
      disabled: options?.disabled,
    });
    return this;
  }

  #stringToEmoji(emoji?: string | bigint) {
    if (!emoji) return;

    emoji = emoji.toString();

    // A snowflake id was provided
    if (snowflakeRegex.test(emoji)) {
      return {
        id: BigInt(emoji.match(snowflakeRegex)![0]),
      };
    }

    // A unicode emoji was provided
    return {
      name: emoji,
    };
  }
}
