import { CommandClientEvents } from "../../types/mod.ts";

export class EventClass<T extends keyof CommandClientEvents> {
  /** The class type */
  public readonly type = "Event";
  /** The event name */
  public readonly event: T;
  /** The function that runs when the event executes */
  public execute?: CommandClientEvents[T];
  constructor(eventName: T) {
    this.event = eventName;
  }
}
