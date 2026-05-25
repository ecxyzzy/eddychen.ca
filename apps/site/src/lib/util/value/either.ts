import { isRightTaggedUnion, isRightTuple } from "../guards";
import type { SyncMonad2 } from "../interfaces";
import { TaskEither } from "../task/task-either";
import type { EitherTaggedUnion, EitherTuple } from "../types";
import { Maybe, None } from "./maybe";
import { Failure, Success, type Try } from "./try";

export type Left<L, R> = _Left<L, R>;
export type Right<L, R> = _Right<L, R>;
export type Either<L, R> = Left<L, R> | Right<L, R>;

export const Left = <L, R = never>(value: L): Either<L, R> => new _Left(value);
export const Right = <L = never, R = unknown>(value: R): Either<L, R> => new _Right(value);
export const Either = {
  fromTuple<L, R>(tuple: EitherTuple<L, R>): Either<L, R> {
    return isRightTuple(tuple) ? Right(tuple[1]) : Left(tuple[0]);
  },
  fromTaggedUnion<L, R, Tag extends string, LKey extends string, RKey extends string>(
    value: EitherTaggedUnion<L, R, Tag, LKey, RKey>,
    tag: Tag,
    leftKey: LKey,
    rightKey: RKey,
  ): Either<L, R> {
    return isRightTaggedUnion(value, tag) ? Right(value[rightKey]) : Left(value[leftKey]);
  },
};

abstract class _Either<L, R> implements SyncMonad2<L, R> {
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
  flat<U = R>(this: Either<L, Either<L, U>>): Either<L, U> {
    return this.flat();
  }
  unzip<A, B>(this: Either<L, [A, B]>): [Either<L, A>, Either<L, B>] {
    if (this.isLeft()) {
      const val = this.swap().unwrap();
      return [new _Left(val), new _Left(val)];
    }
    const [a, b] = this.unwrap();
    return [new _Right(a), new _Right(b)];
  }
  toTask(): TaskEither<L, R> {
    return TaskEither(async () => this as unknown as Either<L, R>);
  }

  abstract get(): R | null;
  abstract unwrap(): R;
  abstract unwrapOrThrow(errorOrFactory: string | Error | ((x: L) => Error)): R;
  abstract map<U>(f: (x: R) => U): Either<L, U>;
  abstract flatMap<U>(f: (x: R) => Either<L, U>): Either<L, U>;
  abstract filterOrElse(f: (x: R) => unknown, leftFactory: (x: R) => L): Either<L, R>;
  abstract narrowOrElse<U extends R>(f: (x: R) => x is U, leftFactory: (x: R) => L): Either<L, U>;
  abstract inspect(f: (x: R) => unknown): Either<L, R>;
  abstract swap(): Either<R, L>;
  abstract match<U>(params: { left: (x: L) => U; right: (x: R) => U }): U;
  abstract forEach(f: (x: R) => unknown): void;
  abstract or(that: Either<L, R>): Either<L, R>;
  abstract orElse(f: () => Either<L, R>): Either<L, R>;
  abstract and<U>(that: Either<L, U>): Either<L, U>;
  abstract xor(that: Either<L, R>, leftValue: L): Either<L, R>;
  abstract zip<U>(that: Either<L, U>): Either<L, [R, U]>;
  abstract zipWith<U, V>(that: Either<L, U>, f: (x: R, y: U) => V): Either<L, V>;
  abstract contains(v: R): boolean;
  abstract toMaybe(): Maybe<R>;
  abstract toTry(): Try<R>;
  abstract toTuple(): EitherTuple<L, R>;
}

class _Right<L, R> extends _Either<L, R> {
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
  unwrapOrThrow(_errorOrFactory: string | Error | ((x: L) => Error)): R {
    return this.value;
  }
  map<U>(f: (x: R) => U): Either<L, U> {
    return new _Right(f(this.value));
  }
  flatMap<U>(f: (x: R) => Either<L, U>): Either<L, U> {
    return f(this.value);
  }

  filterOrElse(f: (x: R) => unknown, leftFactory: (x: R) => L): Either<L, R> {
    return f(this.value) ? this : new _Left(leftFactory(this.value));
  }
  narrowOrElse<U extends R>(f: (x: R) => x is U, leftFactory: (x: R) => L): Either<L, U> {
    return f(this.value) ? (this as unknown as Either<L, U>) : new _Left(leftFactory(this.value));
  }
  inspect(f: (x: R) => unknown): Either<L, R> {
    f(this.value);
    return this;
  }
  swap(): Either<R, L> {
    return new _Left(this.value);
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
    return that.isLeft() ? this : new _Left(leftValue);
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
  toMaybe(): Maybe<R> {
    return Maybe(this.value);
  }
  toTry(): Try<R> {
    return Success(this.value);
  }
  toTuple(): EitherTuple<L, R> {
    return [null, this.value];
  }
  override toString(): string {
    return `Right(${this.value})`;
  }
}

class _Left<L, R> extends _Either<L, R> {
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
    return new _Left(this.value);
  }
  flatMap<U>(_f: (x: R) => Either<L, U>): Either<L, U> {
    return new _Left(this.value);
  }

  filterOrElse(_f: (x: R) => unknown, _leftFactory: (x: R) => L): Either<L, R> {
    return new _Left(this.value);
  }
  narrowOrElse<U extends R>(_f: (x: R) => x is U, _leftFactory: (x: R) => L): Either<L, U> {
    return new _Left(this.value);
  }
  inspect(_f: (x: R) => unknown): Either<L, R> {
    return this;
  }
  swap(): Either<R, L> {
    return new _Right(this.value);
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
    return new _Left(this.value);
  }
  xor(that: Either<L, R>, _leftValue: L): Either<L, R> {
    return that.isRight() ? that : new _Left(this.value);
  }
  zip<U>(_that: Either<L, U>): Either<L, [R, U]> {
    return new _Left(this.value);
  }
  zipWith<U, V>(_that: Either<L, U>, _f: (x: R, y: U) => V): Either<L, V> {
    return new _Left(this.value);
  }
  contains(_v: R): boolean {
    return false;
  }
  toMaybe(): Maybe<R> {
    return None;
  }
  toTry(): Try<R> {
    return Failure(this.value);
  }
  toTuple(): EitherTuple<L, R> {
    return [this.value, null];
  }
  override toString(): string {
    return `Left(${this.value})`;
  }
}
