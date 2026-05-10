import { Maybe } from "./maybe";
import { Try } from "./try";
import type { EitherTaggedUnion, EitherTuple } from "./types";

export type Either<L, R> = Left<L, R> | Right<L, R>;

export const Either = {
  left<L, R = never>(value: L): Either<L, R> {
    return new Left(value);
  },
  right<L = never, R = unknown>(value: R): Either<L, R> {
    return new Right(value);
  },
  fromTaggedUnion<L, R>(value: EitherTaggedUnion<L, R>): Either<L, R> {
    return value.success ? new Right(value.data) : new Left(value.error);
  },
};

abstract class EitherBase<L, R> {
  abstract readonly type: "Left" | "Right";
  isLeft(): this is Left<L, R> {
    return this.type === "Left";
  }
  isRight(): this is Right<L, R> {
    return this.type === "Right";
  }
  isLeftAnd(f: (x: L) => unknown): boolean {
    return this.isLeft() && !!f(this.swap().unwrap());
  }
  isRightAnd(f: (x: R) => unknown): boolean {
    return this.isRight() && !!f(this.unwrap());
  }
  flat<U>(this: Either<L, Either<L, U>>): Either<L, U> {
    return this.flat();
  }
  unzip<A, B>(this: Either<L, [A, B]>): [Either<L, A>, Either<L, B>] {
    if (this.isLeft()) {
      const val = this.swap().unwrap();
      return [new Left(val), new Left(val)];
    }
    const [a, b] = this.unwrap();
    return [new Right(a), new Right(b)];
  }

  abstract get(): R | null;
  abstract unwrap(): R;
  abstract unwrapOr(v: R): R;
  abstract unwrapOrElse(f: () => R): R;
  abstract unwrapOrThrow(errorOrFactory: string | Error | ((x: L) => Error)): R;
  abstract map<U>(f: (x: R) => U): Either<L, U>;
  abstract flatMap<U>(f: (x: R) => Either<L, U>): Either<L, U>;
  abstract filterOrElse(f: (x: R) => unknown, leftFactory: (x: R) => L): Either<L, R>;
  abstract narrowOrElse<U extends R>(f: (x: R) => x is U, leftFactory: (x: R) => L): Either<L, U>;
  abstract inspect(f: (x: R) => unknown): Either<L, R>;
  abstract swap(): Either<R, L>;
  abstract fold<U>(ifLeft: (x: L) => U, ifRight: (x: R) => U): U;
  abstract match<U>(params: { left: (x: L) => U; right: (x: R) => U }): U;
  abstract forEach(f: (x: R) => unknown): void;
  abstract or(that: Either<L, R>): Either<L, R>;
  abstract orElse(f: () => Either<L, R>): Either<L, R>;
  abstract and<U>(that: Either<L, U>): Either<L, U>;
  abstract xor(that: Either<L, R>, leftValue: L): Either<L, R>;
  abstract zip<U>(that: Either<L, U>): Either<L, [R, U]>;
  abstract zipWith<U, V>(that: Either<L, U>, f: (x: R, y: U) => V): Either<L, V>;
  abstract contains(v: R): boolean;
  abstract mapAsync<U>(f: (x: R) => Promise<U>): Promise<Either<L, U>>;
  abstract flatMapAsync<U>(f: (x: R) => Promise<Either<L, U>>): Promise<Either<L, U>>;
  abstract toMaybe(): Maybe<R>;
  abstract toTry(): Try<R>;
  abstract toTuple(): EitherTuple<L, R>;
}

export class Right<L, R> extends EitherBase<L, R> {
  readonly type = "Right" as const;

  constructor(private readonly value: R) {
    super();
  }

  get(): R {
    return this.value;
  }
  unwrap(): R {
    return this.value;
  }
  unwrapOr(_v: R): R {
    return this.value;
  }
  unwrapOrElse(_f: () => R): R {
    return this.value;
  }
  unwrapOrThrow(_errorOrFactory: string | Error | ((x: L) => Error)): R {
    return this.value;
  }
  map<U>(f: (x: R) => U): Either<L, U> {
    return new Right(f(this.value));
  }
  flatMap<U>(f: (x: R) => Either<L, U>): Either<L, U> {
    return f(this.value);
  }

  filterOrElse(f: (x: R) => unknown, leftFactory: (x: R) => L): Either<L, R> {
    return f(this.value) ? this : new Left(leftFactory(this.value));
  }
  narrowOrElse<U extends R>(f: (x: R) => x is U, leftFactory: (x: R) => L): Either<L, U> {
    return f(this.value) ? (this as unknown as Either<L, U>) : new Left(leftFactory(this.value));
  }
  inspect(f: (x: R) => unknown): Either<L, R> {
    f(this.value);
    return this;
  }
  swap(): Either<R, L> {
    return new Left(this.value);
  }
  fold<U>(_ifLeft: (x: L) => U, ifRight: (x: R) => U): U {
    return ifRight(this.value);
  }
  match<U>(params: { left: (x: L) => U; right: (x: R) => U }): U {
    return params.right(this.value);
  }
  forEach(f: (x: R) => unknown): void {
    f(this.value);
  }
  or(_that: Either<L, R>): Either<L, R> {
    return this;
  }
  orElse(_f: () => Either<L, R>): Either<L, R> {
    return this;
  }
  and<U>(that: Either<L, U>): Either<L, U> {
    return that;
  }
  xor(that: Either<L, R>, leftValue: L): Either<L, R> {
    return that.isLeft() ? this : new Left(leftValue);
  }
  zip<U>(that: Either<L, U>): Either<L, [R, U]> {
    return this.flatMap((a) => that.map((b) => [a, b] as [R, U]));
  }
  zipWith<U, V>(that: Either<L, U>, f: (x: R, y: U) => V): Either<L, V> {
    return this.flatMap((a) => that.map((b) => f(a, b)));
  }
  contains(v: R): boolean {
    return this.value === v;
  }
  async mapAsync<U>(f: (x: R) => Promise<U>): Promise<Either<L, U>> {
    return new Right(await f(this.value));
  }
  async flatMapAsync<U>(f: (x: R) => Promise<Either<L, U>>): Promise<Either<L, U>> {
    return f(this.value);
  }
  toMaybe(): Maybe<R> {
    return Maybe.from(this.value);
  }
  toTry(): Try<R> {
    return Try.success(this.value);
  }
  toTuple(): EitherTuple<L, R> {
    return [null, this.value];
  }
  override toString(): string {
    return `Right(${this.value})`;
  }
}

export class Left<L, R> extends EitherBase<L, R> {
  readonly type = "Left" as const;

  constructor(private readonly value: L) {
    super();
  }

  get(): null {
    return null;
  }
  unwrap(): R {
    throw new Error("Called unwrap on instance of Left");
  }
  unwrapOr(v: R): R {
    return v;
  }
  unwrapOrElse(f: () => R): R {
    return f();
  }
  unwrapOrThrow(errorOrFactory: string | Error | ((x: L) => Error)): R {
    switch (typeof errorOrFactory) {
      case "string":
        throw new Error(errorOrFactory);
      case "object":
        throw errorOrFactory;
      case "function":
        throw errorOrFactory(this.value);
    }
  }
  map<U>(_f: (x: R) => U): Either<L, U> {
    return new Left(this.value);
  }
  flatMap<U>(_f: (x: R) => Either<L, U>): Either<L, U> {
    return new Left(this.value);
  }

  filterOrElse(_f: (x: R) => unknown, _leftFactory: (x: R) => L): Either<L, R> {
    return new Left(this.value);
  }
  narrowOrElse<U extends R>(_f: (x: R) => x is U, _leftFactory: (x: R) => L): Either<L, U> {
    return new Left(this.value);
  }
  inspect(_f: (x: R) => unknown): Either<L, R> {
    return this;
  }
  swap(): Either<R, L> {
    return new Right(this.value);
  }
  fold<U>(ifLeft: (x: L) => U, _ifRight: (x: R) => U): U {
    return ifLeft(this.value);
  }
  match<U>(params: { left: (x: L) => U; right: (x: R) => U }): U {
    return params.left(this.value);
  }
  forEach(_f: (x: R) => unknown): void {}
  or(that: Either<L, R>): Either<L, R> {
    return that;
  }
  orElse(f: () => Either<L, R>): Either<L, R> {
    return f();
  }
  and<U>(_that: Either<L, U>): Either<L, U> {
    return new Left(this.value);
  }
  xor(that: Either<L, R>, _leftValue: L): Either<L, R> {
    return that.isRight() ? that : new Left(this.value);
  }
  zip<U>(_that: Either<L, U>): Either<L, [R, U]> {
    return new Left(this.value);
  }
  zipWith<U, V>(_that: Either<L, U>, _f: (x: R, y: U) => V): Either<L, V> {
    return new Left(this.value);
  }
  contains(_v: R): boolean {
    return false;
  }
  async mapAsync<U>(_f: (x: R) => Promise<U>): Promise<Either<L, U>> {
    return new Left(this.value);
  }
  async flatMapAsync<U>(_f: (x: R) => Promise<Either<L, U>>): Promise<Either<L, U>> {
    return new Left(this.value);
  }
  toMaybe(): Maybe<R> {
    return Maybe.none();
  }
  toTry(): Try<R> {
    return Try.failure(this.value);
  }
  toTuple(): EitherTuple<L, R> {
    return [this.value, null];
  }
  override toString(): string {
    return `Left(${this.value})`;
  }
}
