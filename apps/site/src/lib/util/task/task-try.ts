import type { AsyncMonad, Runnable } from "../interfaces";
import type { MaybeAsyncFn } from "../types";
import { Failure, Success, type Try } from "../value/try";

export type TaskTry<T> = _TaskTry<T>;
export const TaskTry = <T>(f: () => Promise<T>): TaskTry<T> =>
  new _TaskTry(async () => {
    try {
      return Success(await f());
    } catch (e) {
      return Failure(e);
    }
  });

class _TaskTry<T> implements AsyncMonad<T>, Runnable<Try<T>> {
  constructor(private readonly task: () => Promise<Try<T>>) {}

  static from<T>(f: () => Promise<Try<T>>) {
    return new _TaskTry(f);
  }

  map<U>(f: MaybeAsyncFn<T, U>): TaskTry<U> {
    return new _TaskTry(async () => {
      const t = await this.task();
      if (t.isFailure()) {
        return t as unknown as Try<U>;
      }
      return TaskTry(async () => await f(t.get())).run();
    });
  }

  flatMap<U>(f: (x: T) => TaskTry<U>): TaskTry<U> {
    return new _TaskTry(async () => {
      const t = await this.task();
      if (t.isFailure()) {
        return t as unknown as Try<U>;
      }
      return f(t.get()).run();
    });
  }

  filter(f: MaybeAsyncFn<T, unknown>): TaskTry<T> {
    return new _TaskTry(async () => {
      const t = await this.task();
      if (t.isFailure()) {
        return t;
      }
      return (await f(t.get())) ? t : Failure(new Error("Predicate does not hold"));
    });
  }

  filterOrElse<E = unknown>(
    f: MaybeAsyncFn<T, unknown>,
    errorFactory: MaybeAsyncFn<T, E>,
  ): TaskTry<T> {
    return new _TaskTry(async () => {
      const t = await this.task();
      if (t.isFailure()) {
        return t;
      }
      return (await f(t.get())) ? t : Failure(await errorFactory(t.get()));
    });
  }

  run(): Promise<Try<T>> {
    return this.task();
  }
}

TaskTry.from = _TaskTry.from;
