import { AmethystBot, AmethystCollection, AmethystEvents } from "../../mod.ts";

export class AmethystEventHandler {
  client: AmethystBot;
  events: AmethystCollection<
    string,
    (<T extends keyof AmethystEvents>(
      ...args: [...Parameters<AmethystEvents[T]>]
    ) => Promise<void>)[]
  >;
  constructor(client: AmethystBot) {
    this.client = client;
    this.events = new AmethystCollection();
    let k: keyof typeof client.events;
    for (k in client.events) {
      this.events.set(k, []);
      client.events[k];
    }
  }

  on(event: string, listener: (...args: any) => Promise<void>): this {
    this.events.get(event)?.push(listener);
    return this;
  }

  dispatch(event: string, args: any): void {
    this.events.get(event)?.forEach((cb) => cb(...args));
  }
}
