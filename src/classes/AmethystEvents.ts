import { AmethystBot, AmethystCollection } from "../../mod.ts";

export class AmethystEventHandler {
  client: AmethystBot;
  events: AmethystCollection<string, ((...args: any) => unknown)[]>;
  constructor(client: AmethystBot) {
    this.client = client;
    this.events = new AmethystCollection();
    let k: keyof typeof client.events;
    for (k in client.events) {
      this.events.set(k, [client.events[k]]);
      client.events[k] = (...args: any) => {
        this.dispatch(k, args);
      };
    }
  }

  on(event: string, listener: (...args: any) => unknown): this {
    this.events.get(event)?.push(listener);
    return this;
  }

  dispatch(event: string, args: any): void {
    this.events.get(event)?.forEach((cb) => cb(...args));
  }
}
