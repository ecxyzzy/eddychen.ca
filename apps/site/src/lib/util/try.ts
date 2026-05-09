import type { Either } from "./either";
import { Left, Right } from "./either";
import { Maybe } from "./maybe";
import type { EitherTuple } from "./types";

export type Try<T> = Success<T> | Failure<T>;

export const Try = {
  success<T>(value: T): Try<T> {
    return new Success(value);
  },
  failure<T = never>(error: unknown): Try<T> {
    return new Failure(error);
  },
  from<T>(f: () => T): Try<T> {
    try {
      return Try.success(f());
    } catch (e) {
      return Try.failure(e);
    }
  },
  async fromAsync<T>(f: () => Promise<T>): Promise<Try<T>> {
    try {
      return Try.success(await f());
    } catch (e) {
      return Try.failure(e);
    }
  },
};

abstract class TryBase<T> {
  abstract readonly type: "Success" | "Failure";
  isSuccess(): this is Success<T> {
    return this.type === "Success";
  }
  isFailure(): this is Failure<T> {
    return this.type === "Failure";
  }
  isSuccessAnd(f: (x: T) => unknown): boolean {
    return this.isSuccess() && !!f(this.get());
  }
  isFailureOr(f: (x: T) => unknown): boolean {
    return this.isFailure() || !!f(this.get());
  }
  flat<U>(this: Try<Try<U>>): Try<U> {
    return this.flat();
  }
  unzip<A, B>(this: Try<[A, B]>): [Try<A>, Try<B>] {
    try {
      const [a, b] = this.get();
      return [Try.success(a), Try.success(b)];
    } catch (e) {
      return [Try.failure(e), Try.failure(e)];
    }
  }

  abstract get(): T;
  abstract map<U>(f: (x: T) => U): Try<U>;
  abstract flatMap<U>(f: (x: T) => Try<U>): Try<U>;
  abstract filter(f: (x: T) => unknown): Try<T>;
  abstract filterOrElse<E = unknown>(f: (x: T) => unknown, errorFactory: (x: T) => E): Try<T>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Try<U>;
  abstract inspect(f: (x: T) => unknown): Try<T>;
  abstract fold<U>(ifFailure: () => U, ifSuccess: (x: T) => U): U;
  abstract match<U>(params: {
    success: (x: T) => U;
    failure: (e: unknown) => U;
  }): U;
  abstract forEach(f: (x: T) => unknown): void;
  abstract or(that: Try<T>): Try<T>;
  abstract orElse(f: () => Try<T>): Try<T>;
  abstract and<U>(that: Try<U>): Try<U>;
  abstract xor(that: Try<T>): Try<T>;
  abstract zip<U>(that: Try<U>): Try<[T, U]>;
  abstract zipWith<U, V>(that: Try<U>, f: (x: T, y: U) => V): Try<V>;
  abstract contains(v: T): boolean;
  abstract mapAsync<U>(f: (x: T) => Promise<U>): Promise<Try<U>>;
  abstract flatMapAsync<U>(f: (x: T) => Promise<Try<U>>): Promise<Try<U>>;
  abstract recover<E = unknown>(f: (e: E) => T): Try<T>;
  abstract recoverWith<E = unknown>(f: (e: E) => Try<T>): Try<T>;
  abstract mapError<E = unknown>(f: (e: E) => unknown): Try<T>;
  abstract failed<E = unknown>(): Try<E>;
  abstract toMaybe(): Maybe<T>;
  abstract toTuple(): EitherTuple<unknown, T>;
  abstract toEither<E = unknown>(): Either<E, T>;
}

export class Success<T> extends TryBase<T> {
  readonly type = "Success" as const;

  constructor(private readonly value: T) {
    super();
  }

  get(): T {
    return this.value;
  }
  map<U>(f: (x: T) => U): Try<U> {
    try {
      return Try.success(f(this.value));
    } catch (e) {
      return Try.failure(e);
    }
  }
  flatMap<U>(f: (x: T) => Try<U>): Try<U> {
    try {
      return f(this.value);
    } catch (e) {
      return Try.failure(e);
    }
  }
  filter(f: (x: T) => unknown): Try<T> {
    return f(this.value) ? this : Try.failure(new Error("Predicate does not hold"));
  }
  filterOrElse<E = unknown>(f: (x: T) => unknown, errorFactory: (x: T) => E): Try<T> {
    return f(this.value) ? this : Try.failure(errorFactory(this.value));
  }
  narrow<U extends T>(f: (x: T) => x is U): Try<U> {
    return f(this.value)
      ? (this as unknown as Try<U>)
      : Try.failure(new Error("Predicate does not hold"));
  }
  inspect(f: (x: T) => unknown): Try<T> {
    f(this.value);
    return this;
  }
  fold<U>(_ifFailure: () => U, ifSuccess: (x: T) => U): U {
    return ifSuccess(this.value);
  }
  match<U>(params: { success: (x: T) => U; failure: (e: unknown) => U }): U {
    return params.success(this.value);
  }
  forEach(f: (x: T) => unknown): void {
    f(this.value);
  }
  or(_that: Try<T>): Try<T> {
    return this;
  }
  orElse(_f: () => Try<T>): Try<T> {
    return this;
  }
  and<U>(that: Try<U>): Try<U> {
    return that;
  }
  xor(that: Try<T>): Try<T> {
    return that.isFailure() ? this : Try.failure(new Error("Both were Success"));
  }
  zip<U>(that: Try<U>): Try<[T, U]> {
    return this.flatMap((a) => that.map((b) => [a, b] as [T, U]));
  }
  zipWith<U, V>(that: Try<U>, f: (x: T, y: U) => V): Try<V> {
    return this.flatMap((a) => that.map((b) => f(a, b)));
  }
  contains(v: T): boolean {
    return this.value === v;
  }
  async mapAsync<U>(f: (x: T) => Promise<U>): Promise<Try<U>> {
    try {
      return Try.success(await f(this.value));
    } catch (e) {
      return Try.failure(e);
    }
  }
  async flatMapAsync<U>(f: (x: T) => Promise<Try<U>>): Promise<Try<U>> {
    try {
      return await f(this.value);
    } catch (e) {
      return Try.failure(e);
    }
  }
  recover<E = unknown>(_f: (e: E) => T): Try<T> {
    return this;
  }
  recoverWith<E = unknown>(_f: (e: E) => Try<T>): Try<T> {
    return this;
  }
  mapError<E = unknown>(_f: (e: E) => unknown): Try<T> {
    return this;
  }
  failed<E = unknown>(): Try<E> {
    return Try.failure(new Error("Called failed on a Success"));
  }
  toMaybe(): Maybe<T> {
    return Maybe.from(this.value);
  }
  toTuple(): EitherTuple<unknown, T> {
    return [null, this.value];
  }
  toEither<E = unknown>(): Either<E, T> {
    return new Right(this.value);
  }
  override toString(): string {
    return `Success(${this.value})`;
  }
}

/** Variant of {@link Try} that contains an error from a failed computation. */
export class Failure<T> extends TryBase<T> {
  readonly type = "Failure" as const;

  constructor(private readonly error: unknown) {
    super();
  }

  get(): T {
    throw this.error;
  }
  map<U>(_f: (x: T) => U): Try<U> {
    return Try.failure<U>(this.error);
  }
  flatMap<U>(_f: (x: T) => Try<U>): Try<U> {
    return Try.failure<U>(this.error);
  }
  filter(_f: (x: T) => unknown): Try<T> {
    return Try.failure<T>(this.error);
  }
  filterOrElse<E = unknown>(_f: (x: T) => unknown, _errorFactory: (x: T) => E): Try<T> {
    return Try.failure<T>(this.error);
  }
  narrow<U extends T>(_f: (x: T) => x is U): Try<U> {
    return Try.failure<U>(this.error);
  }
  inspect(_f: (x: T) => unknown): Try<T> {
    return this;
  }
  fold<U>(ifFailure: () => U, _ifSuccess: (x: T) => U): U {
    return ifFailure();
  }
  match<U>(params: { success: (x: T) => U; failure: (e: unknown) => U }): U {
    return params.failure(this.error);
  }
  forEach(_f: (x: T) => unknown): void {}
  or(that: Try<T>): Try<T> {
    return that;
  }
  orElse(f: () => Try<T>): Try<T> {
    return f();
  }
  and<U>(_that: Try<U>): Try<U> {
    return Try.failure<U>(this.error);
  }
  xor(that: Try<T>): Try<T> {
    return that.isSuccess() ? that : Try.failure<T>(this.error);
  }
  zip<U>(_that: Try<U>): Try<[T, U]> {
    return Try.failure<[T, U]>(this.error);
  }
  zipWith<U, V>(_that: Try<U>, _f: (x: T, y: U) => V): Try<V> {
    return Try.failure<V>(this.error);
  }
  contains(_v: T): boolean {
    return false;
  }
  async mapAsync<U>(_f: (x: T) => Promise<U>): Promise<Try<U>> {
    return Try.failure<U>(this.error);
  }
  async flatMapAsync<U>(_f: (x: T) => Promise<Try<U>>): Promise<Try<U>> {
    return Try.failure<U>(this.error);
  }
  recover<E = unknown>(f: (e: E) => T): Try<T> {
    try {
      return Try.success(f(this.error as E));
    } catch (e) {
      return Try.failure(e);
    }
  }
  recoverWith<E = unknown>(f: (e: E) => Try<T>): Try<T> {
    try {
      return f(this.error as E);
    } catch (e) {
      return Try.failure(e);
    }
  }
  mapError<E = unknown>(f: (e: E) => unknown): Try<T> {
    return Try.failure<T>(f(this.error as E));
  }
  failed<E = unknown>(): Try<E> {
    return Try.success(this.error as E);
  }
  toMaybe(): Maybe<T> {
    return Maybe.none();
  }
  toTuple(): EitherTuple<unknown, T> {
    return [this.error, null];
  }
  toEither<E = unknown>(): Either<E, T> {
    return new Left(this.error as E);
  }
  override toString(): string {
    return `Failure(${this.error})`;
  }
}
