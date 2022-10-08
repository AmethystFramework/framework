/* eslint-disable id-length */
/* eslint-disable no-param-reassign */

/*
 * TAKEN FROM https://github.com/discordjs/discord.js/blob/b2ec86576/packages/AmethystCollection/src/AmethystCollection.ts#L28
 */
/**
 * @internal
 */
export interface CollectionConstructor {
  new (): AmethystCollection<unknown, unknown>;
  new <K, V>(entries?: readonly (readonly [K, V])[] | null): AmethystCollection<
    K,
    V
  >;
  new <K, V>(iterable: Iterable<readonly [K, V]>): AmethystCollection<K, V>;
  readonly prototype: AmethystCollection<unknown, unknown>;
  readonly [Symbol.species]: CollectionConstructor;
}

/**
 * Represents an immutable version of a AmethystCollection
 */
export type ReadonlyCollection<K, V> = Omit<
  AmethystCollection<K, V>,
  "delete" | "ensure" | "forEach" | "get" | "reverse" | "set" | "sort" | "sweep"
> &
  ReadonlyMap<K, V>;

/**
 * Separate interface for the constructor so that emitted js does not have a constructor that overwrites itself
 *
 * @internal
 */
export interface AmethystCollection<K, V> extends Map<K, V> {
  constructor: CollectionConstructor;
}
export class AmethystCollection<K, V> extends Map<K, V> {
  /**
   * Obtains the value of the given key if it exists, otherwise sets and returns the value provided by the default value generator.
   *
   * @param key - The key to get if it exists, or set otherwise
   * @param defaultValueGenerator - A function that generates the default value
   * @example
   * ```ts
   * AmethystCollection.ensure(guildId, () => defaultGuildConfig);
   * ```
   */
  public ensure(
    key: K,
    defaultValueGenerator: (key: K, AmethystCollection: this) => V
  ): V {
    if (this.has(key)) return this.get(key)!;
    if (typeof defaultValueGenerator !== "function")
      throw new TypeError(`${defaultValueGenerator} is not a function`);
    const defaultValue = defaultValueGenerator(key, this);
    this.set(key, defaultValue);
    return defaultValue;
  }

  /**
   * Checks if all of the elements exist in the AmethystCollection.
   *
   * @param keys - The keys of the elements to check for
   * @returns `true` if all of the elements exist, `false` if at least one does not exist.
   */
  public hasAll(...keys: K[]) {
    return keys.every((k) => super.has(k));
  }

  /**
   * Checks if any of the elements exist in the AmethystCollection.
   *
   * @param keys - The keys of the elements to check for
   * @returns `true` if any of the elements exist, `false` if none exist.
   */
  public hasAny(...keys: K[]) {
    return keys.some((k) => super.has(k));
  }

  /**
   * Obtains the first value(s) in this AmethystCollection.
   *
   * @param amount - Amount of values to obtain from the beginning
   * @returns A single value if no amount is provided or an array of values, starting from the end if amount is negative
   */
  public first(): V | undefined;
  public first(amount: number): V[];
  public first(amount?: number): V | V[] | undefined {
    if (typeof amount === "undefined") return this.values().next().value;
    if (amount < 0) return this.last(amount * -1);
    amount = Math.min(this.size, amount);
    const iter = this.values();
    return Array.from({ length: amount }, (): V => iter.next().value);
  }

  /**
   * Obtains the first key(s) in this AmethystCollection.
   *
   * @param amount - Amount of keys to obtain from the beginning
   * @returns A single key if no amount is provided or an array of keys, starting from the end if
   * amount is negative
   */
  public firstKey(): K | undefined;
  public firstKey(amount: number): K[];
  public firstKey(amount?: number): K | K[] | undefined {
    if (typeof amount === "undefined") return this.keys().next().value;
    if (amount < 0) return this.lastKey(amount * -1);
    amount = Math.min(this.size, amount);
    const iter = this.keys();
    return Array.from({ length: amount }, (): K => iter.next().value);
  }

  /**
   * Obtains the last value(s) in this AmethystCollection.
   *
   * @param amount - Amount of values to obtain from the end
   * @returns A single value if no amount is provided or an array of values, starting from the start if
   * amount is negative
   */
  public last(): V | undefined;
  public last(amount: number): V[];
  public last(amount?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (typeof amount === "undefined") return arr[arr.length - 1];
    if (amount < 0) return this.first(amount * -1);
    if (!amount) return [];
    return arr.slice(-amount);
  }

  /**
   * Obtains the last key(s) in this AmethystCollection.
   *
   * @param amount - Amount of keys to obtain from the end
   * @returns A single key if no amount is provided or an array of keys, starting from the start if
   * amount is negative
   */
  public lastKey(): K | undefined;
  public lastKey(amount: number): K[];
  public lastKey(amount?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (typeof amount === "undefined") return arr[arr.length - 1];
    if (amount < 0) return this.firstKey(amount * -1);
    if (!amount) return [];
    return arr.slice(-amount);
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at | Array.at()}.
   * Returns the item at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the AmethystCollection.
   *
   * @param index - The index of the element to obtain
   */
  public at(index: number) {
    index = Math.floor(index);
    const arr = [...this.values()];
    return arr.at(index);
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/at | Array.at()}.
   * Returns the key at a given index, allowing for positive and negative integers.
   * Negative integers count back from the last item in the AmethystCollection.
   *
   * @param index - The index of the key to obtain
   */
  public keyAt(index: number) {
    index = Math.floor(index);
    const arr = [...this.keys()];
    return arr.at(index);
  }

  /**
   * Obtains unique random value(s) from this AmethystCollection.
   *
   * @param amount - Amount of values to obtain randomly
   * @returns A single value if no amount is provided or an array of values
   */
  public random(): V | undefined;
  public random(amount: number): V[];
  public random(amount?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (typeof amount === "undefined")
      return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !amount) return [];
    return Array.from(
      { length: Math.min(amount, arr.length) },
      (): V => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]!
    );
  }

  /**
   * Obtains unique random key(s) from this AmethystCollection.
   *
   * @param amount - Amount of keys to obtain randomly
   * @returns A single key if no amount is provided or an array
   */
  public randomKey(): K | undefined;
  public randomKey(amount: number): K[];
  public randomKey(amount?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (typeof amount === "undefined")
      return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !amount) return [];
    return Array.from(
      { length: Math.min(amount, arr.length) },
      (): K => arr.splice(Math.floor(Math.random() * arr.length), 1)[0]!
    );
  }

  /**
   * Identical to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse | Array.reverse()}
   * but returns a AmethystCollection instead of an Array.
   */
  public reverse() {
    const entries = [...this.entries()].reverse();
    this.clear();
    for (const [key, value] of entries) this.set(key, value);
    return this;
  }

  /**
   * Searches for a single item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find | Array.find()}.
   * All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
   * should use the `get` method. See
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get | MDN} for details.
   *
   * @param fn - The function to test with (should return boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.find(user => user.username === 'Bob');
   * ```
   */
  public find<V2 extends V>(
    fn: (value: V, key: K, AmethystCollection: this) => value is V2
  ): V2 | undefined;
  public find(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): V | undefined;
  public find<This, V2 extends V>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => value is V2,
    thisArg: This
  ): V2 | undefined;
  public find<This>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: This
  ): V | undefined;
  public find(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): V | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }

    return undefined;
  }
  /**
   * Searches for the key of a single item where the given function returns a truthy value. This behaves like
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex | Array.findIndex()},
   * but returns the key rather than the positional index.
   *
   * @param fn - The function to test with (should return boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.findKey(user => user.username === 'Bob');
   * ```
   */
  public findKey<K2 extends K>(
    fn: (value: V, key: K, AmethystCollection: this) => key is K2
  ): K2 | undefined;
  public findKey(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): K | undefined;
  public findKey<This, K2 extends K>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => key is K2,
    thisArg: This
  ): K2 | undefined;
  public findKey<This>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: This
  ): K | undefined;
  public findKey(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): K | undefined {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return key;
    }

    return undefined;
  }

  /**
   * Removes items that satisfy the provided filter function.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @returns The number of removed entries
   */
  public sweep(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): number;
  public sweep<T>(
    fn: (this: T, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: T
  ): number;
  public sweep(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): number {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const previousSize = this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) this.delete(key);
    }

    return previousSize - this.size;
  }

  /**
   * Identical to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter | Array.filter()},
   * but returns a AmethystCollection instead of an Array.
   *
   * @param fn - The function to test with (should return boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.filter(user => user.username === 'Bob');
   * ```
   */
  public filter<K2 extends K>(
    fn: (value: V, key: K, AmethystCollection: this) => key is K2
  ): AmethystCollection<K2, V>;
  public filter<V2 extends V>(
    fn: (value: V, key: K, AmethystCollection: this) => value is V2
  ): AmethystCollection<K, V2>;
  public filter(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): AmethystCollection<K, V>;
  public filter<This, K2 extends K>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => key is K2,
    thisArg: This
  ): AmethystCollection<K2, V>;
  public filter<This, V2 extends V>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => value is V2,
    thisArg: This
  ): AmethystCollection<K, V2>;
  public filter<This>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: This
  ): AmethystCollection<K, V>;
  public filter(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): AmethystCollection<K, V> {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const results = new this.constructor[Symbol.species]<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }

    return results;
  }

  /**
   * Partitions the AmethystCollection into two collections where the first AmethystCollection
   * contains the items that passed and the second contains the items that failed.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * const [big, small] = AmethystCollection.partition(guild => guild.memberCount > 250);
   * ```
   */
  public partition<K2 extends K>(
    fn: (value: V, key: K, AmethystCollection: this) => key is K2
  ): [AmethystCollection<K2, V>, AmethystCollection<Exclude<K, K2>, V>];
  public partition<V2 extends V>(
    fn: (value: V, key: K, AmethystCollection: this) => value is V2
  ): [AmethystCollection<K, V2>, AmethystCollection<K, Exclude<V, V2>>];
  public partition(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): [AmethystCollection<K, V>, AmethystCollection<K, V>];
  public partition<This, K2 extends K>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => key is K2,
    thisArg: This
  ): [AmethystCollection<K2, V>, AmethystCollection<Exclude<K, K2>, V>];
  public partition<This, V2 extends V>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => value is V2,
    thisArg: This
  ): [AmethystCollection<K, V2>, AmethystCollection<K, Exclude<V, V2>>];
  public partition<This>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: This
  ): [AmethystCollection<K, V>, AmethystCollection<K, V>];
  public partition(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): [AmethystCollection<K, V>, AmethystCollection<K, V>] {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const results: [AmethystCollection<K, V>, AmethystCollection<K, V>] = [
      new this.constructor[Symbol.species]<K, V>(),
      new this.constructor[Symbol.species]<K, V>(),
    ];
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        results[0].set(key, val);
      } else {
        results[1].set(key, val);
      }
    }

    return results;
  }

  /**
   * Maps each item into a AmethystCollection, then joins the results into a single AmethystCollection. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap | Array.flatMap()}.
   *
   * @param fn - Function that produces a new AmethystCollection
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.flatMap(guild => guild.members.cache);
   * ```
   */
  public flatMap<T>(
    fn: (value: V, key: K, AmethystCollection: this) => AmethystCollection<K, T>
  ): AmethystCollection<K, T>;
  public flatMap<T, This>(
    fn: (
      this: This,
      value: V,
      key: K,
      AmethystCollection: this
    ) => AmethystCollection<K, T>,
    thisArg: This
  ): AmethystCollection<K, T>;
  public flatMap<T>(
    fn: (
      value: V,
      key: K,
      AmethystCollection: this
    ) => AmethystCollection<K, T>,
    thisArg?: unknown
  ): AmethystCollection<K, T> {
    // eslint-disable-next-line unicorn/no-array-method-this-argument
    const collections = this.map(fn, thisArg);
    return new this.constructor[Symbol.species]<K, T>().concat(...collections);
  }

  /**
   * Maps each item to another value into an array. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | Array.map()}.
   *
   * @param fn - Function that produces an element of the new array, taking three arguments
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.map(user => user.tag);
   * ```
   */
  public map<T>(fn: (value: V, key: K, AmethystCollection: this) => T): T[];
  public map<This, T>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => T,
    thisArg: This
  ): T[];
  public map<T>(
    fn: (value: V, key: K, AmethystCollection: this) => T,
    thisArg?: unknown
  ): T[] {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const iter = this.entries();
    return Array.from({ length: this.size }, (): T => {
      const [key, value] = iter.next().value;
      return fn(value, key, this);
    });
  }

  /**
   * Maps each item to another value into a AmethystCollection. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map | Array.map()}.
   *
   * @param fn - Function that produces an element of the new AmethystCollection, taking three arguments
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.mapValues(user => user.tag);
   * ```
   */
  public mapValues<T>(
    fn: (value: V, key: K, AmethystCollection: this) => T
  ): AmethystCollection<K, T>;
  public mapValues<This, T>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => T,
    thisArg: This
  ): AmethystCollection<K, T>;
  public mapValues<T>(
    fn: (value: V, key: K, AmethystCollection: this) => T,
    thisArg?: unknown
  ): AmethystCollection<K, T> {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    const coll = new this.constructor[Symbol.species]<K, T>();
    for (const [key, val] of this) coll.set(key, fn(val, key, this));
    return coll;
  }

  /**
   * Checks if there exists an item that passes a test. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some | Array.some()}.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.some(user => user.discriminator === '0000');
   * ```
   */
  public some(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): boolean;
  public some<T>(
    fn: (this: T, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: T
  ): boolean;
  public some(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): boolean {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }

    return false;
  }

  /**
   * Checks if all items passes a test. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every | Array.every()}.
   *
   * @param fn - Function used to test (should return a boolean)
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection.every(user => !user.bot);
   * ```
   */
  public every<K2 extends K>(
    fn: (value: V, key: K, AmethystCollection: this) => key is K2
  ): this is AmethystCollection<K2, V>;
  public every<V2 extends V>(
    fn: (value: V, key: K, AmethystCollection: this) => value is V2
  ): this is AmethystCollection<K, V2>;
  public every(
    fn: (value: V, key: K, AmethystCollection: this) => unknown
  ): boolean;
  public every<This, K2 extends K>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => key is K2,
    thisArg: This
  ): this is AmethystCollection<K2, V>;
  public every<This, V2 extends V>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => value is V2,
    thisArg: This
  ): this is AmethystCollection<K, V2>;
  public every<This>(
    fn: (this: This, value: V, key: K, AmethystCollection: this) => unknown,
    thisArg: This
  ): boolean;
  public every(
    fn: (value: V, key: K, AmethystCollection: this) => unknown,
    thisArg?: unknown
  ): boolean {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }

    return true;
  }

  /**
   * Applies a function to produce a single value. Identical in behavior to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce | Array.reduce()}.
   *
   * @param fn - Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
   * and `AmethystCollection`
   * @param initialValue - Starting value for the accumulator
   * @example
   * ```ts
   * AmethystCollection.reduce((acc, guild) => acc + guild.memberCount, 0);
   * ```
   */
  public reduce<T>(
    fn: (accumulator: T, value: V, key: K, AmethystCollection: this) => T,
    initialValue?: T
  ): T {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    let accumulator!: T;

    if (typeof initialValue !== "undefined") {
      accumulator = initialValue;
      for (const [key, val] of this)
        accumulator = fn(accumulator, val, key, this);
      return accumulator;
    }

    let first = true;
    for (const [key, val] of this) {
      if (first) {
        accumulator = val as unknown as T;
        first = false;
        continue;
      }

      accumulator = fn(accumulator, val, key, this);
    }

    // No items iterated.
    if (first) {
      throw new TypeError(
        "Reduce of empty AmethystCollection with no initial value"
      );
    }

    return accumulator;
  }

  /**
   * Identical to
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach | Map.forEach()},
   * but returns the AmethystCollection instead of undefined.
   *
   * @param fn - Function to execute for each element
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection
   *  .each(user => console.log(user.username))
   *  .filter(user => user.bot)
   *  .each(user => console.log(user.username));
   * ```
   */
  public each(fn: (value: V, key: K, AmethystCollection: this) => void): this;
  public each<T>(
    fn: (this: T, value: V, key: K, AmethystCollection: this) => void,
    thisArg: T
  ): this;
  public each(
    fn: (value: V, key: K, AmethystCollection: this) => void,
    thisArg?: unknown
  ): this {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    // eslint-disable-next-line unicorn/no-array-method-this-argument
    this.forEach(fn as (value: V, key: K, map: Map<K, V>) => void, thisArg);
    return this;
  }

  /**
   * Runs a function on the AmethystCollection and returns the AmethystCollection.
   *
   * @param fn - Function to execute
   * @param thisArg - Value to use as `this` when executing function
   * @example
   * ```ts
   * AmethystCollection
   *  .tap(coll => console.log(coll.size))
   *  .filter(user => user.bot)
   *  .tap(coll => console.log(coll.size))
   * ```
   */
  public tap(fn: (AmethystCollection: this) => void): this;
  public tap<T>(
    fn: (this: T, AmethystCollection: this) => void,
    thisArg: T
  ): this;
  public tap(fn: (AmethystCollection: this) => void, thisArg?: unknown): this {
    if (typeof fn !== "function")
      throw new TypeError(`${fn} is not a function`);
    if (typeof thisArg !== "undefined") fn = fn.bind(thisArg);
    fn(this);
    return this;
  }

  /**
   * Creates an identical shallow copy of this AmethystCollection.
   *
   * @example
   * ```ts
   * const newColl = someColl.clone();
   * ```
   */
  public clone(): AmethystCollection<K, V> {
    return new this.constructor[Symbol.species](this);
  }

  /**
   * Combines this AmethystCollection with others into a new AmethystCollection. None of the source collections are modified.
   *
   * @param collections - Collections to merge
   * @example
   * ```ts
   * const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
   * ```
   */
  public concat(...collections: ReadonlyCollection<K, V>[]) {
    const newColl = this.clone();
    for (const coll of collections) {
      for (const [key, val] of coll) newColl.set(key, val);
    }

    return newColl;
  }

  /**
   * Checks if this AmethystCollection shares identical items with another.
   * This is different to checking for equality using equal-signs, because
   * the collections may be different objects, but contain the same data.
   *
   * @param AmethystCollection - AmethystCollection to compare with
   * @returns Whether the collections have identical contents
   */
  public equals(AmethystCollection: ReadonlyCollection<K, V>) {
    if (!AmethystCollection) return false; // runtime check
    if (this === AmethystCollection) return true;
    if (this.size !== AmethystCollection.size) return false;
    for (const [key, value] of this) {
      if (
        !AmethystCollection.has(key) ||
        value !== AmethystCollection.get(key)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * The sort method sorts the items of a AmethystCollection in place and returns it.
   * The sort is not necessarily stable in Node 10 or older.
   * The default sort order is according to string Unicode code points.
   *
   * @param compareFunction - Specifies a function that defines the sort order.
   * If omitted, the AmethystCollection is sorted according to each character's Unicode code point value, according to the string conversion of each element.
   * @example
   * ```ts
   * AmethystCollection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
   * ```
   */
  public sort(
    compareFunction: Comparator<K, V> = AmethystCollection.defaultSort
  ) {
    const entries = [...this.entries()];
    entries.sort((a, b): number => compareFunction(a[1], b[1], a[0], b[0]));

    // Perform clean-up
    super.clear();

    // Set the new entries
    for (const [k, v] of entries) {
      super.set(k, v);
    }

    return this;
  }

  /**
   * The intersect method returns a new structure containing items where the keys and values are present in both original structures.
   *
   * @param other - The other AmethystCollection to filter against
   */
  public intersect<T>(
    other: ReadonlyCollection<K, T>
  ): AmethystCollection<K, T> {
    const coll = new this.constructor[Symbol.species]<K, T>();
    for (const [k, v] of other) {
      if (this.has(k) && Object.is(v, this.get(k))) {
        coll.set(k, v);
      }
    }

    return coll;
  }

  /**
   * The difference method returns a new structure containing items where the key is present in one of the original structures but not the other.
   *
   * @param other - The other AmethystCollection to filter against
   */
  public difference<T>(
    other: ReadonlyCollection<K, T>
  ): AmethystCollection<K, T | V> {
    const coll = new this.constructor[Symbol.species]<K, T | V>();
    for (const [k, v] of other) {
      if (!this.has(k)) coll.set(k, v);
    }

    for (const [k, v] of this) {
      if (!other.has(k)) coll.set(k, v);
    }

    return coll;
  }

  /**
   * Merges two Collections together into a new AmethystCollection.
   *
   * @param other - The other AmethystCollection to merge with
   * @param whenInSelf - Function getting the result if the entry only exists in this AmethystCollection
   * @param whenInOther - Function getting the result if the entry only exists in the other AmethystCollection
   * @param whenInBoth - Function getting the result if the entry exists in both Collections
   * @example
   * ```ts
   * // Sums up the entries in two collections.
   * coll.merge(
   *  other,
   *  x => ({ keep: true, value: x }),
   *  y => ({ keep: true, value: y }),
   *  (x, y) => ({ keep: true, value: x + y }),
   * );
   * ```
   * @example
   * ```ts
   * // Intersects two collections in a left-biased manner.
   * coll.merge(
   *  other,
   *  x => ({ keep: false }),
   *  y => ({ keep: false }),
   *  (x, _) => ({ keep: true, value: x }),
   * );
   * ```
   */
  public merge<T, R>(
    other: ReadonlyCollection<K, T>,
    whenInSelf: (value: V, key: K) => Keep<R>,
    whenInOther: (valueOther: T, key: K) => Keep<R>,
    whenInBoth: (value: V, valueOther: T, key: K) => Keep<R>
  ): AmethystCollection<K, R> {
    const coll = new this.constructor[Symbol.species]<K, R>();
    const keys = new Set([...this.keys(), ...other.keys()]);
    for (const k of keys) {
      const hasInSelf = this.has(k);
      const hasInOther = other.has(k);

      if (hasInSelf && hasInOther) {
        const r = whenInBoth(this.get(k)!, other.get(k)!, k);
        if (r.keep) coll.set(k, r.value);
      } else if (hasInSelf) {
        const r = whenInSelf(this.get(k)!, k);
        if (r.keep) coll.set(k, r.value);
      } else if (hasInOther) {
        const r = whenInOther(other.get(k)!, k);
        if (r.keep) coll.set(k, r.value);
      }
    }

    return coll;
  }

  /**
   * The sorted method sorts the items of a AmethystCollection and returns it.
   * The sort is not necessarily stable in Node 10 or older.
   * The default sort order is according to string Unicode code points.
   *
   * @param compareFunction - Specifies a function that defines the sort order.
   * If omitted, the AmethystCollection is sorted according to each character's Unicode code point value,
   * according to the string conversion of each element.
   * @example
   * ```ts
   * AmethystCollection.sorted((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
   * ```
   */
  public sorted(
    compareFunction: Comparator<K, V> = AmethystCollection.defaultSort
  ) {
    return new this.constructor[Symbol.species](this).sort((av, bv, ak, bk) =>
      compareFunction(av, bv, ak, bk)
    );
  }

  public toJSON() {
    // toJSON is called recursively by JSON.stringify.
    return [...this.values()];
  }

  private static defaultSort<V>(firstValue: V, secondValue: V): number {
    return (
      Number(firstValue > secondValue) || Number(firstValue === secondValue) - 1
    );
  }

  /**
   * Creates a AmethystCollection from a list of entries.
   *
   * @param entries - The list of entries
   * @param combine - Function to combine an existing entry with a new one
   * @example
   * ```ts
   * AmethystCollection.combineEntries([["a", 1], ["b", 2], ["a", 2]], (x, y) => x + y);
   * // returns AmethystCollection { "a" => 3, "b" => 2 }
   * ```
   */
  public static combineEntries<K, V>(
    entries: Iterable<[K, V]>,
    combine: (firstValue: V, secondValue: V, key: K) => V
  ): AmethystCollection<K, V> {
    const coll = new AmethystCollection<K, V>();
    for (const [k, v] of entries) {
      if (coll.has(k)) {
        coll.set(k, combine(coll.get(k)!, v, k));
      } else {
        coll.set(k, v);
      }
    }

    return coll;
  }
}
/**
 * @internal
 */
export type Keep<V> = { keep: false } | { keep: true; value: V };

/**
 * @internal
 */
export type Comparator<K, V> = (
  firstValue: V,
  secondValue: V,
  firstKey: K,
  secondKey: K
) => number;
