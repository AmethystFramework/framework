import {
  DiscordEmbedAuthor,
  DiscordEmbedField,
  DiscordEmbedFooter,
  DiscordEmbedImage,
} from "../../deps.ts";

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

/*A class to create embed easily*/
export class AmethystEmbed {
  /** The amount of characters in the embed. */
  currentTotal = 0;
  /** Whether the limits should be enforced or not. */
  enforceLimits = true;
  /** If a file is attached to the message it will be added here. */
  file?: EmbedFile;

  color = 0x41ebf4;
  fields: DiscordEmbedField[] = [];
  author?: DiscordEmbedAuthor;
  description?: string;
  footer?: DiscordEmbedFooter;
  image?: DiscordEmbedImage;
  timestamp?: string;
  title?: string;
  thumbnail?: DiscordEmbedImage;
  url?: string;

  constructor(enforceLimits = true) {
    // By default we will always want to enforce discord limits but this option allows us to bypass for whatever reason.
    if (!enforceLimits) this.enforceLimits = false;

    return this;
  }

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

  setAuthor(name: string, icon?: string, url?: string) {
    const finalName = this.enforceLimits
      ? this.fitData(name, embedLimits.authorName)
      : name;
    this.author = { name: finalName, icon_url: icon, url };

    return this;
  }

  setColor(color: string) {
    this.color =
      color.toLowerCase() === `random`
        ? // Random color
          Math.floor(Math.random() * (0xffffff + 1))
        : // Convert the hex to a acceptable color for discord
          parseInt(color.replace("#", ""), 16);

    return this;
  }

  setDescription(description: string | string[]) {
    if (Array.isArray(description)) description = description.join("\n");
    this.description = this.fitData(description, embedLimits.description);

    return this;
  }

  addField(name: string, value: string, inline = false) {
    if (this.fields.length >= 25) return this;

    this.fields.push({
      name: this.fitData(name, embedLimits.fieldName),
      value: this.fitData(value, embedLimits.fieldValue),
      inline,
    });

    return this;
  }

  addBlankField(inline = false) {
    return this.addField("\u200B", "\u200B", inline);
  }

  attachFile(file: Blob, name: string) {
    this.file = {
      blob: file,
      name,
    };
    this.setImage(`attachment://${name}`);

    return this;
  }

  setFooter(text: string, icon?: string) {
    this.footer = {
      text: this.fitData(text, embedLimits.footerText),
      icon_url: icon,
    };

    return this;
  }

  setImage(url: string) {
    this.image = { url };

    return this;
  }

  setTimestamp(time = Date.now()) {
    this.timestamp = new Date(time).toISOString();

    return this;
  }

  setTitle(title: string, url?: string) {
    this.title = this.fitData(title, embedLimits.title);
    if (url) this.url = url;

    return this;
  }

  setThumbnail(url: string) {
    this.thumbnail = { url };

    return this;
  }
}

export interface EmbedFile {
  blob: Blob;
  name: string;
}
