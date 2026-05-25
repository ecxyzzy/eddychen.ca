import type { AsyncMonad2, Runnable } from "../interfaces";
import type { MaybeAsyncFn } from "../types";
import { type Either, Right } from "../value/either";

export type TaskEither<L, R> = _TaskEither<L, R>;

export const TaskEither = <L, R>(f: () => Promise<Either<L, R>>): TaskEither<L, R> =>
  new _TaskEither(f);

class _TaskEither<L, R> implements AsyncMonad2<L, R>, Runnable<Either<L, R>> {
  constructor(private readonly task: () => Promise<Either<L, R>>) {}

  static from<L, R>(f: () => Promise<Either<L, R>>) {
    return new _TaskEither(f);
  }

  map<T>(f: MaybeAsyncFn<R, T>): TaskEither<L, T> {
    return new _TaskEither(async () => {
      const e = await this.task();
      if (e.isLeft()) {
        return e as unknown as Either<L, T>;
      }
      return Right(await f(e.get()));
    });
  }

  flatMap<T>(f: (x: R) => TaskEither<L, T>): TaskEither<L, T> {
    return new _TaskEither(async () => {
      const e = await this.task();
      if (e.isLeft()) {
        return e as unknown as Either<L, T>;
      }
      return f(e.get()).run();
    });
  }

  swap(): TaskEither<R, L> {
    return new _TaskEither(async () => {
      const e = await this.task();
      return e.swap();
    });
  }

  run(): Promise<Either<L, R>> {
    return this.task();
  }
}
