import { TaskMaybe } from "@lib/util/task/task-maybe";
import { List } from "@lib/util/value/list";
import type { SyncMonad } from "../interfaces";
import type { Nullable } from "../types";
import { type Either, Left, Right } from "./either";

export type Some<T> = _Some<T>;
export type None<T> = _None<T>;
export type Maybe<T> = Some<T> | None<T>;

export const Some = <T>(value: NonNullable<T>): Maybe<T> => new _Some(value);
export const Maybe = <T>(maybeValue: Nullable<T>): Maybe<T> =>
  maybeValue !== null && maybeValue !== undefined ? Some(maybeValue) : None;

abstract class _Maybe<T> implements SyncMonad<T> {
  abstract readonly type: "Some" | "None";

  static all<A>(ms: [Maybe<A>]): Maybe<[A]>;
  static all<A, B>(ms: [Maybe<A>, Maybe<B>]): Maybe<[A, B]>;
  static all<A, B, C>(ms: [Maybe<A>, Maybe<B>, Maybe<C>]): Maybe<[A, B, C]>;
  static all<A, B, C, D>(ms: [Maybe<A>, Maybe<B>, Maybe<C>, Maybe<D>]): Maybe<[A, B, C, D]>;
  static all(ms: Maybe<unknown>[]): Maybe<unknown[]> {
    const results: unknown[] = [];
    for (const m of ms) {
      if (m.isNone()) return None;
      results.push(m.get());
    }
    return Maybe(results);
  }

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
      return [None, None];
    }
    const [a, b] = this.unwrap();
    return [Maybe(a), Maybe(b)];
  }
  toList<U>(this: Maybe<U[]>): List<U> {
    return this.isNone() ? List() : List(...this.get());
  }

  abstract get(): Nullable<T>;
  abstract unwrap(): T;
  abstract unwrapOrThrow(errorOrFactory: string | Error | (() => Error)): T;
  abstract map<U>(f: (x: T) => Nullable<U>): Maybe<U>;
  abstract flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U>;
  abstract filter(f: (x: T) => unknown): Maybe<T>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Maybe<U>;
  abstract inspect(f: (x: T) => unknown): Maybe<T>;
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
  abstract toRight<L>(leftValue: L): Either<L, T>;
  abstract toTask(): TaskMaybe<T>;
}

class _Some<T> extends _Maybe<T> {
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
  unwrapOrThrow(_errorOrFactory: string | Error | (() => Error)): T {
    return this.value;
  }
  map<U>(f: (x: T) => Nullable<U>): Maybe<U> {
    return Maybe(f(this.value));
  }
  flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U> {
    return f(this.value);
  }
  filter(f: (x: T) => unknown): Maybe<T> {
    return f(this.value) ? this : None;
  }
  narrow<U extends T>(f: (x: T) => x is U): Maybe<U> {
    return f(this.value) ? (this as unknown as Maybe<U>) : None;
  }
  inspect(f: (x: T) => unknown): Maybe<T> {
    f(this.value);
    return this;
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
    return that.isNone() ? this : None;
  }
  zip<U>(that: Maybe<U>): Maybe<[T, U]> {
    return this.flatMap((a) => that.map((b) => [a, b]));
  }
  zipWith<U, V>(that: Maybe<U>, f: (x: T, y: U) => V): Maybe<V> {
    return that.isSome() ? Maybe(f(this.value, that.unwrap())) : None;
  }
  contains(v: T): boolean {
    return this.value === v;
  }
  toArray(): T[] {
    return [this.value];
  }
  toRight<L>(_leftValue: L): Either<L, T> {
    return Right(this.value);
  }
  toTask(): TaskMaybe<T> {
    return TaskMaybe(async () => this);
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

class _None<T> extends _Maybe<T> {
  readonly type = "None" as const;

  get(): null {
    return null;
  }
  unwrap(): T {
    throw new Error("Called unwrap on instance of None");
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
    return None;
  }
  flatMap<U>(): Maybe<U> {
    return None;
  }
  filter(_f: (x: T) => unknown): Maybe<T> {
    return this;
  }
  narrow<U extends T>(_f: (x: T) => x is U): Maybe<U> {
    return None;
  }
  inspect(): Maybe<T> {
    return this;
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
    return None;
  }
  xor(that: Maybe<T>): Maybe<T> {
    return that.isSome() ? that : this;
  }
  zip<U>(_that: Maybe<U>): Maybe<[T, U]> {
    return None;
  }
  zipWith<U, V>(_that: Maybe<U>, _f: (x: T, y: U) => V): Maybe<V> {
    return None;
  }
  contains(_v: T): boolean {
    return false;
  }
  toArray(): T[] {
    return [];
  }
  toRight<L>(leftValue: L): Either<L, T> {
    return Left(leftValue);
  }
  toTask(): TaskMaybe<T> {
    return TaskMaybe(async () => this);
  }
  [Symbol.iterator](): Iterator<T> {
    return (function* () {})();
  }
  override toString() {
    return "None";
  }
}

Maybe.all = _Maybe.all;

export const None: None<never> = new _None();
