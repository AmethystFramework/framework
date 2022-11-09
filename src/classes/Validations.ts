const nameRegex = new RegExp(
  /^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u
);
export function validateName(name: string) {
  if (name.length < 1)
    throw new Error(`The name (${name}) must have alteast 1 characters.`);
  if (name.length > 31)
    throw new Error(`The name (${name}) must have less than 32 characters`);
  if (nameRegex.test(name)) return name;
  throw new Error(`The name (${name}) is not valid.`);
}

export function validateDescription(description: string) {
  if (description.length < 1)
    throw new Error(
      `The description (${description}) must have alteast 1 characters.`
    );
  if (description.length > 99)
    throw new Error(
      `The description (${description}) must have less than 100 characters`
    );
}

export function validateMaxOptionsLength(options: any[]) {
  if (options.length > 24)
    throw new Error(`The options  must have less than 25 elements`);
}

export function validateRequiredParameters(
  name: string,
  description: string,
  options: any[]
) {
  // Assert name matches all conditions
  validateName(name);

  // Assert description conditions
  validateDescription(description);

  // Assert options conditions
  validateMaxOptionsLength(options);
}
