import { DiscordEmbedField } from "../../deps.ts";

const embedLimits = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  fields: 25,
  total: 6000,
};

/**
 * A class to create embed easily
 * */
export class AmethystEmbed {
  /** The amount of characters in the embed. */
  currentTotal = 0;
  /** Whether the limits should be enforced or not. */
  enforceLimits = true;
  /** If a file is attached to the message it will be added here. */
  file?: EmbedFile;

  color = 0x41ebf4;
  fields: DiscordEmbedField[] = [];
  author?: {
    name: string;
    iconUrl?: string;
    url?: string;
  };
  description?: string;
  footer?: {
    text: string;
    iconUrl?: string;
  };
  image?: {
    url: string;
  };
  timestamp?: string;
  title?: string;
  thumbnail?: {
    url: string;
  };
  url?: string;

  /**
   * By default we will always want to enforce discord limits but this option allows us to bypass for
   * whatever reason.
   * @param [enforceLimits=true] - This is a boolean value that determines whether or not the library
   * will enforce the Discord limits.
   * @returns The class itself.
   */
  constructor(enforceLimits = true) {
    // By default we will always want to enforce discord limits but this option allows us to bypass for whatever reason.
    if (!enforceLimits) this.enforceLimits = false;

    return this;
  }

  /**
   * If the string is bigger then the allowed max shorten it. If it is maxed out already return empty
   * string as nothing can be added anymore. If the string breaks the maximum embed limit then shorten
   * it. Return the data as is with no changes
   * @param {string} data - The string to be checked.
   * @param {number} max - number - The maximum amount of characters allowed for this field.
   * @returns The data that is being returned is the data that is being passed in.
   */
  fitData(data: string, max: number) {
    // If the string is bigger then the allowed max shorten it.
    if (data.length > max) data = data.substring(0, max);
    // Check the amount of characters left for this embed
    const availableCharacters = embedLimits.total - this.currentTotal;
    // If it is maxed out already return empty string as nothing can be added anymore
    if (!availableCharacters) return ``;
    // If the string breaks the maximum embed limit then shorten it.
    if (this.currentTotal + data.length > embedLimits.total) {
      return data.substring(0, availableCharacters);
    }
    // Return the data as is with no changes.
    return data;
  }

  /**
   * This function sets the author of the embed, and returns the embed object.
   * @param {string} name - string - The name of the author.
   * @param {string} [icon] - The icon of the author.
   * @param {string} [url] - string
   * @returns The object itself.
   */
  setAuthor(name: string, icon?: string, url?: string) {
    const finalName = this.enforceLimits
      ? this.fitData(name, embedLimits.authorName)
      : name;
    this.author = { name: finalName, iconUrl: icon, url };

    return this;
  }

  /**
   * It sets the color of the embed to a random color or a color that the user has specified.
   * @param {string} color - The color of the embed.
   * @returns The class itself.
   */
  setColor(color: string) {
    this.color =
      color.toLowerCase() === `random`
        ? // Random color
          Math.floor(Math.random() * (0xffffff + 1))
        : // Convert the hex to a acceptable color for discord
          parseInt(color.replace("#", ""), 16);

    return this;
  }

  /**
   * It takes a string or an array of strings and sets the description of the embed to the string or
   * the array of strings joined by a newline
   * @param {string | string[]} description - The description of the embed.
   * @returns The embed object itself.
   */
  setDescription(description: string | string[]) {
    if (Array.isArray(description)) description = description.join("\n");
    this.description = this.fitData(description, embedLimits.description);

    return this;
  }

  /**
   * It adds a field to the embed.
   * @param {string} name - string - The name of the field.
   * @param {string} value - The value of the field. This can be a string, or an array of strings. If
   * you want to use an array, you have to set the inline field option to true, otherwise it will be
   * ignored.
   * @param [inline=false] - boolean
   * @returns The object itself.
   */
  addField(name: string, value: string, inline = false) {
    if (this.fields.length >= 25) return this;

    this.fields.push({
      name: this.fitData(name, embedLimits.fieldName),
      value: this.fitData(value, embedLimits.fieldValue),
      inline,
    });

    return this;
  }

  /**
   * It adds a blank field to the embed
   * @param [inline=false] - Boolean - Whether or not this field should display inline
   * @returns The return value of the addField method.
   */
  addBlankField(inline = false) {
    return this.addField("\u200B", "\u200B", inline);
  }

  /**
   * It takes a file and a name, and sets the file to the blob and name, and then sets the image to the
   * name.
   * @param {Blob} file - Blob - The file to attach.
   * @param {string} name - The name of the file.
   * @returns The object itself.
   */
  attachFile(file: Blob, name: string) {
    this.file = {
      blob: file,
      name,
    };
    this.setImage(`attachment://${name}`);

    return this;
  }
  /**
   * This function sets the footer of the embed.
   * @param {string} text - The text of the footer.
   * @param {string} [icon] - The icon of the embed, displayed at the top-right corner.
   * @returns The object itself.
   */
  setFooter(text: string, icon?: string) {
    this.footer = {
      text: this.fitData(text, embedLimits.footerText),
      iconUrl: icon,
    };

    return this;
  }

  /**
   * This function takes a string as an argument and sets the image property of the object to the value
   * of the argument.
   * @param {string} url - The URL of the image to display.
   * @returns The object itself.
   */
  setImage(url: string) {
    this.image = { url };

    return this;
  }

  /**
   * If the user doesn't pass in a value for the time parameter, then the function will use the current
   * time as the default value.
   * @param time - The timestamp to set the date to.
   * @returns The object itself.
   */
  setTimestamp(time = Date.now()) {
    this.timestamp = time + "";

    return this;
  }

  /**
   * The function takes a string and an optional string as arguments and returns the object it was
   * called on
   * @param {string} title - The title of the embed.
   * @param {string} [url] - The URL of the embed.
   * @returns The object itself.
   */
  setTitle(title: string, url?: string) {
    this.title = this.fitData(title, embedLimits.title);
    if (url) this.url = url;

    return this;
  }

  /**
   * This function takes a string as an argument and sets the thumbnail property of the object to the
   * value of the argument.
   * @param {string} url - The URL of the thumbnail.
   * @returns The object itself.
   */
  setThumbnail(url: string) {
    this.thumbnail = { url };

    return this;
  }
}

export interface EmbedFile {
  blob: Blob;
  name: string;
}
