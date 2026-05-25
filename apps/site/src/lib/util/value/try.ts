import { TaskTry } from "../task/task-try";
import type { EitherTuple } from "../types";
import { type Either, Left, Right } from "./either";
import { Maybe, None } from "./maybe";

export type Success<T> = _Success<T>;
export type Failure<T> = _Failure<T>;
export type Try<T> = _Success<T> | Failure<T>;

export const Success = <T>(value: T): Try<T> => new _Success(value);
export const Failure = <T>(error: unknown): Try<T> => new _Failure(error);
export const Try = <T>(f: () => T): Try<T> => {
  try {
    return Success(f());
  } catch (e) {
    return Failure(e);
  }
};

abstract class _Try<T> {
  abstract readonly type: "Success" | "Failure";
  isSuccess(): this is Success<T> {
    return this.type === "Success";
  }
  isFailure(): this is Failure<T> {
    return this.type === "Failure";
  }
  flat<U = T>(this: Try<Try<U>>): Try<U> {
    return this.flat();
  }
  unzip<A, B>(this: Try<[A, B]>): [Try<A>, Try<B>] {
    try {
      const [a, b] = this.get();
      return [Success(a), Success(b)];
    } catch (e) {
      return [Failure(e), Failure(e)];
    }
  }

  abstract get(): T;
  abstract map<U>(f: (x: T) => U): Try<U>;
  abstract flatMap<U>(f: (x: T) => Try<U>): Try<U>;
  abstract filter(f: (x: T) => unknown): Try<T>;
  abstract filterOrElse<E = unknown>(f: (x: T) => unknown, errorFactory: (x: T) => E): Try<T>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Try<U>;
  abstract inspect(f: (x: T) => unknown): Try<T>;
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
  abstract recover<E = unknown>(f: (e: E) => T): Try<T>;
  abstract recoverWith<E = unknown>(f: (e: E) => Try<T>): Try<T>;
  abstract mapError<E = unknown>(f: (e: E) => unknown): Try<T>;
  abstract failed<E = unknown>(): Try<E>;
  abstract toMaybe(): Maybe<T>;
  abstract toTuple(): EitherTuple<unknown, T>;
  abstract toEither<E = unknown>(): Either<E, T>;
  abstract toTask(): TaskTry<T>;
}

class _Success<T> extends _Try<T> {
  readonly type = "Success" as const;

  constructor(private readonly value: T) {
    super();
  }

  get(): T {
    return this.value;
  }
  map<U>(f: (x: T) => U): Try<U> {
    try {
      return Success(f(this.value));
    } catch (e) {
      return Failure(e);
    }
  }
  flatMap<U>(f: (x: T) => Try<U>): Try<U> {
    try {
      return f(this.value);
    } catch (e) {
      return Failure(e);
    }
  }
  filter(f: (x: T) => unknown): Try<T> {
    return f(this.value) ? this : Failure(new Error("Predicate does not hold"));
  }
  filterOrElse<E = unknown>(f: (x: T) => unknown, errorFactory: (x: T) => E): Try<T> {
    return f(this.value) ? this : Failure(errorFactory(this.value));
  }
  narrow<U extends T>(f: (x: T) => x is U): Try<U> {
    return f(this.value)
      ? (this as unknown as Try<U>)
      : Failure(new Error("Predicate does not hold"));
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
    return that.isFailure() ? this : Failure(new Error("Both were Success"));
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
    return Failure(new Error("Called failed on a Success"));
  }
  toMaybe(): Maybe<T> {
    return Maybe(this.value);
  }
  toTuple(): EitherTuple<unknown, T> {
    return [null, this.value];
  }
  toEither<E = unknown>(): Either<E, T> {
    return Right(this.value);
  }
  toTask(): TaskTry<T> {
    return TaskTry.from(async () => this);
  }
  override toString(): string {
    return `Success(${this.value})`;
  }
}

class _Failure<T> extends _Try<T> {
  readonly type = "Failure" as const;

  constructor(private readonly error: unknown) {
    super();
  }

  get(): T {
    throw this.error;
  }
  map<U>(_f: (x: T) => U): Try<U> {
    return Failure(this.error);
  }
  flatMap<U>(_f: (x: T) => Try<U>): Try<U> {
    return Failure(this.error);
  }
  filter(_f: (x: T) => unknown): Try<T> {
    return this;
  }
  filterOrElse<E = unknown>(_f: (x: T) => unknown, _errorFactory: (x: T) => E): Try<T> {
    return this;
  }
  narrow<U extends T>(_f: (x: T) => x is U): Try<U> {
    return Failure(this.error);
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
    return Failure(this.error);
  }
  xor(that: Try<T>): Try<T> {
    return that.isSuccess() ? that : Failure<T>(this.error);
  }
  zip<U>(_that: Try<U>): Try<[T, U]> {
    return Failure(this.error);
  }
  zipWith<U, V>(_that: Try<U>, _f: (x: T, y: U) => V): Try<V> {
    return Failure(this.error);
  }
  contains(_v: T): boolean {
    return false;
  }
  recover<E = unknown>(f: (e: E) => T): Try<T> {
    try {
      return Success(f(this.error as E));
    } catch (e) {
      return Failure(e);
    }
  }
  recoverWith<E = unknown>(f: (e: E) => Try<T>): Try<T> {
    try {
      return f(this.error as E);
    } catch (e) {
      return Failure(e);
    }
  }
  mapError<E = unknown>(f: (e: E) => unknown): Try<T> {
    return this;
  }
  failed<E = unknown>(): Try<E> {
    return Success(this.error as E);
  }
  toMaybe(): Maybe<T> {
    return None;
  }
  toTuple(): EitherTuple<unknown, T> {
    return [this.error, null];
  }
  toEither<E = unknown>(): Either<E, T> {
    return Left(this.error as E);
  }
  toTask(): TaskTry<T> {
    return TaskTry.from(async () => this);
  }
  override toString(): string {
    return `Failure(${this.error})`;
  }
}
