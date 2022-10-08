type CategoryOptions = {
  /* Name of the category */
  name: string;
  /* Information about the category */
  description: string;
  /* Treat each command as a subcommand or a command on its own. */
  uniqueCommands: boolean;
  /* Default command when uniqueCommand is false. */
  default: string;
};
