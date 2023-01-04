import { AmethystBot, AmethystCollection } from '../../mod.ts';

/* It's a class that can be used to handle events. */
export class AmethystEventHandler {
  client: AmethystBot;
  events: AmethystCollection<string, ((...args: any[]) => unknown)[]>;
  constructor(client: AmethystBot) {
    this.client = client;
    this.events = new AmethystCollection();
    for (const [k, _v] of Object.entries(client.events)) {
      //@ts-ignore this should fix types
      this.events.set(k, [client.events[k]]);
      //@ts-ignore this should fix types
      client.events[k] = (...args: any[]) => {
        /* Dispatching the event to the event handler. */
        client.eventHandler.dispatch(k, ...args);
      };
    }
  }

  /**
   * If the event exists, add the listener to the event, otherwise create the event and add the
   * listener to it.
   * @param {string} event - string - The name of the event.
   * @param listener - (...args: any[]) => unknown
   * @returns The instance of the class.
   */
  on(event: string, listener: (...args: any[]) => unknown): this {
    let events = this.events.get(event);
    if (events) events.push(listener);
    else {
      events = [listener];
      try {
        //@ts-ignore this should fix types
        this.client.events[event] = (...args: any[]) => {
          /* Dispatching the event to the event handler. */
          this.client.eventHandler.dispatch(event, ...args);
        };
      } catch {
        //
      }
    }

    this.events.set(event, events);
    return this;
  }

  /**
   * For each event in the events map, if the event name matches the event passed in, then call each
   * listener function with the arguments passed in
   * @param {string} event - string - The name of the event to dispatch.
   * @param {any[]} args - any[] - This is an array of any type. This is used to pass in any arguments
   * that you want to pass to the event listener.
   */
  dispatch(event: string, ...args: any[]): void {
    this.events.forEach((events, name) => {
      if (name === event) {
        events.forEach((listener) => {
          listener.call(this, ...args);
        });
      }
    });
  }
}
