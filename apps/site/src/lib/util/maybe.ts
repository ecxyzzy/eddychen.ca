import type { Either } from "./either";
import { Left, Right } from "./either";
import type { Nullable } from "./types";

export type Maybe<T> = Some<T> | None<T>;

export const Maybe = {
  some<T>(value: NonNullable<T>): Maybe<T> {
    return new Some(value);
  },
  none<T = never>(): Maybe<T> {
    return NONE as Maybe<T>;
  },
  from<T>(maybeValue: Nullable<T>): Maybe<T> {
    if (maybeValue !== null && maybeValue !== undefined) {
      return Maybe.some(maybeValue);
    }
    return Maybe.none<T>();
  },
};

abstract class MaybeBase<T> {
  abstract readonly type: "Some" | "None";
  isSome(): this is Some<T> {
    return this.type === "Some";
  }
  isNone(): this is None<T> {
    return this.type === "None";
  }
  isSomeAnd(f: (x: T) => unknown): boolean {
    return this.isSome() && !!f(this.unwrap());
  }
  isNoneOr(f: (x: T) => unknown): boolean {
    return this.isNone() || !!f(this.unwrap());
  }
  flat<U = T>(this: Maybe<Maybe<U>>): Maybe<U> {
    return this.flat();
  }
  unzip<A, B>(this: Maybe<[A, B]>): [Maybe<A>, Maybe<B>] {
    if (this.isNone()) {
      return [Maybe.none<A>(), Maybe.none<B>()];
    }
    const [a, b] = this.unwrap();
    return [Maybe.from(a), Maybe.from(b)];
  }

  abstract get(): Nullable<T>;
  abstract unwrap(): T;
  abstract unwrapOr(v: T): T;
  abstract unwrapOrElse(f: () => T): T;
  abstract unwrapOrThrow(errorOrFactory: string | Error | (() => Error)): T;
  abstract map<U>(f: (x: T) => U): Maybe<U>;
  abstract flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U>;
  abstract filter(f: (x: T) => unknown): Maybe<T>;
  abstract filterAsync(f: (x: T) => Promise<unknown>): Promise<Maybe<T>>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Maybe<U>;
  abstract inspect(f: (x: T) => unknown): Maybe<T>;
  abstract fold<U>(ifNone: () => U, ifSome: (x: T) => U): U;
  abstract match<U>(params: { some: (x: T) => U; none: () => U }): U;
  abstract forEach(f: (x: T) => unknown): void;
  abstract or(that: Maybe<T>): Maybe<T>;
  abstract orElse(f: () => Maybe<T>): Maybe<T>;
  abstract and<U>(that: Maybe<U>): Maybe<U>;
  abstract xor(that: Maybe<T>): Maybe<T>;
  abstract zip<U>(that: Maybe<U>): Maybe<[T, U]>;
  abstract zipWith<U, V>(that: Maybe<U>, f: (x: T, y: U) => V): Maybe<V>;
  abstract contains(v: T): boolean;
  abstract toArray(): T[];
  abstract mapAsync<U>(f: (x: T) => Promise<U>): Promise<Maybe<U>>;
  abstract flatMapAsync<U>(f: (x: T) => Promise<Maybe<U>>): Promise<Maybe<U>>;
  abstract toRight<L>(leftValue: L): Either<L, T>;
}

export class Some<T> extends MaybeBase<T> {
  readonly type = "Some" as const;

  constructor(private readonly value: NonNullable<T>) {
    super();
  }

  get(): NonNullable<T> {
    return this.value;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(_v: T): T {
    return this.value;
  }
  unwrapOrElse(_f: () => T): T {
    return this.value;
  }
  unwrapOrThrow(_errorOrFactory: string | Error | (() => Error)): T {
    return this.value;
  }
  map<U>(f: (x: T) => Nullable<U>): Maybe<U> {
    return Maybe.from(f(this.value));
  }
  flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U> {
    return f(this.value);
  }
  filter(f: (x: T) => unknown): Maybe<T> {
    return f(this.value) ? this : Maybe.none<T>();
  }
  async filterAsync(f: (x: T) => Promise<unknown>): Promise<Maybe<T>> {
    return (await f(this.value)) ? this : Maybe.none<T>();
  }
  narrow<U extends T>(f: (x: T) => x is U): Maybe<U> {
    return f(this.value) ? (this as unknown as Maybe<U>) : Maybe.none<U>();
  }
  inspect(f: (x: T) => unknown): Maybe<T> {
    f(this.value);
    return this;
  }
  fold<U>(_ifNone: () => U, ifSome: (x: T) => U): U {
    return ifSome(this.value);
  }
  match<U>(params: { some: (x: T) => U; none: () => U }): U {
    return params.some(this.value);
  }
  forEach(f: (x: T) => unknown): void {
    f(this.value);
  }
  or(_that: Maybe<T>): Maybe<T> {
    return this;
  }
  orElse(_f: () => Maybe<T>): Maybe<T> {
    return this;
  }
  and<U>(that: Maybe<U>): Maybe<U> {
    return that;
  }
  xor(that: Maybe<T>): Maybe<T> {
    return that.isNone() ? this : Maybe.none<T>();
  }
  zip<U>(that: Maybe<U>): Maybe<[T, U]> {
    return this.flatMap((a) => that.map((b) => [a, b]));
  }
  zipWith<U, V>(that: Maybe<U>, f: (x: T, y: U) => V): Maybe<V> {
    return that.isSome() ? Maybe.from(f(this.value, that.unwrap())) : Maybe.none<V>();
  }
  contains(v: T): boolean {
    return this.value === v;
  }
  toArray(): T[] {
    return [this.value];
  }
  async mapAsync<U>(f: (x: T) => Promise<U>): Promise<Maybe<U>> {
    return Maybe.from(await f(this.value));
  }
  async flatMapAsync<U>(f: (x: T) => Promise<Maybe<U>>): Promise<Maybe<U>> {
    return f(this.value);
  }
  toRight<L>(_leftValue: L): Either<L, T> {
    return new Right(this.value);
  }
  [Symbol.iterator](): Iterator<T> {
    const val = this.value;
    return (function* () {
      yield val;
    })();
  }
  override toString() {
    return `Some(${this.value})`;
  }
}

export class None<T> extends MaybeBase<T> {
  readonly type = "None" as const;

  get(): null {
    return null;
  }
  unwrap(): T {
    throw new Error("Called unwrap on instance of None");
  }
  unwrapOr(v: T): T {
    return v;
  }
  unwrapOrElse(f: () => T): T {
    return f();
  }
  unwrapOrThrow(errorOrFactory: string | Error | (() => Error)): T {
    switch (typeof errorOrFactory) {
      case "string":
        throw new Error(errorOrFactory);
      case "object":
        throw errorOrFactory;
      case "function":
        throw errorOrFactory();
    }
  }
  map<U>(): Maybe<U> {
    return Maybe.none<U>();
  }
  flatMap<U>(): Maybe<U> {
    return Maybe.none<U>();
  }
  filter(_f: (x: T) => unknown): Maybe<T> {
    return this;
  }
  async filterAsync(_f: (x: T) => Promise<unknown>): Promise<Maybe<T>> {
    return this;
  }
  narrow<U extends T>(_f: (x: T) => x is U): Maybe<U> {
    return Maybe.none<U>();
  }
  inspect(): Maybe<T> {
    return this;
  }
  fold<U>(ifNone: () => U, _ifSome: (x: T) => U): U {
    return ifNone();
  }
  match<U>(params: { some: (x: T) => U; none: () => U }): U {
    return params.none();
  }
  forEach(): void {}
  or(that: Maybe<T>): Maybe<T> {
    return that;
  }
  orElse(f: () => Maybe<T>): Maybe<T> {
    return f();
  }
  and<U>(): Maybe<U> {
    return Maybe.none<U>();
  }
  xor(that: Maybe<T>): Maybe<T> {
    return that.isSome() ? that : this;
  }
  zip<U>(_that: Maybe<U>): Maybe<[T, U]> {
    return Maybe.none<[T, U]>();
  }
  zipWith<U, V>(_that: Maybe<U>, _f: (x: T, y: U) => V): Maybe<V> {
    return Maybe.none<V>();
  }
  contains(_v: T): boolean {
    return false;
  }
  toArray(): T[] {
    return [];
  }
  async mapAsync<U>(_f: (x: T) => Promise<U>): Promise<Maybe<U>> {
    return Maybe.none<U>();
  }
  async flatMapAsync<U>(_f: (x: T) => Promise<Maybe<U>>): Promise<Maybe<U>> {
    return Maybe.none<U>();
  }
  toRight<L>(leftValue: L): Either<L, T> {
    return new Left(leftValue);
  }
  [Symbol.iterator](): Iterator<T> {
    return (function* () {})();
  }
  override toString() {
    return "None";
  }
}

const NONE: None<never> = new None();
