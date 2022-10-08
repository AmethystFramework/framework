export interface CommandCooldown {
  /**The amount of seconds before the command is useable again*/
  seconds: number;
  /**The amount of uses that can be used before the seconds passes*/
  allowedUses?: number;
}
