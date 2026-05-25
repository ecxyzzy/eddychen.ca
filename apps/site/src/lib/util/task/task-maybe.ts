import type { AsyncMonad, Runnable } from "../interfaces";
import type { MaybeAsyncFn, Nullable } from "../types";
import { Left, Right } from "../value/either";
import { List } from "../value/list";
import { Maybe, None } from "../value/maybe";
import { TaskEither } from "./task-either";
import { TaskList } from "./task-list";

export type TaskMaybe<T> = _TaskMaybe<T>;
export const TaskMaybe = <T>(f: () => Promise<Maybe<T>>): TaskMaybe<T> => new _TaskMaybe<T>(f);

class _TaskMaybe<T> implements AsyncMonad<T>, Runnable<Maybe<T>> {
  constructor(private readonly task: () => Promise<Maybe<T>>) {}

  static from<T>(f: () => Promise<Nullable<T>>): TaskMaybe<T> {
    return new _TaskMaybe(async () => Maybe(await f()));
  }

  static all<A>(ts: [TaskMaybe<A>]): TaskMaybe<[A]>;
  static all<A, B>(ts: [TaskMaybe<A>, TaskMaybe<B>]): TaskMaybe<[A, B]>;
  static all<A, B, C>(ts: [TaskMaybe<A>, TaskMaybe<B>, TaskMaybe<C>]): TaskMaybe<[A, B, C]>;
  static all<A, B, C, D>(
    ts: [TaskMaybe<A>, TaskMaybe<B>, TaskMaybe<C>, TaskMaybe<D>],
  ): TaskMaybe<[A, B, C, D]>;
  static all(ts: TaskMaybe<unknown>[]): TaskMaybe<unknown[]> {
    return new _TaskMaybe(async () => {
      const results: unknown[] = [];
      for (const t of ts) {
        const m = await t.run();
        if (m.isNone()) return None;
        results.push(m.get());
      }
      return Maybe(results);
    });
  }

  map<U>(f: MaybeAsyncFn<T, Nullable<U>>): TaskMaybe<U> {
    return new _TaskMaybe(async () => {
      const x = await this.task();
      return x.isNone() ? None : Maybe(await f(x.unwrap()));
    });
  }

  flatMap<U>(f: (x: T) => TaskMaybe<U>): TaskMaybe<U> {
    return new _TaskMaybe(async () => {
      const x = await this.task();
      return x.isNone() ? None : f(x.unwrap()).run();
    });
  }

  filter(f: MaybeAsyncFn<T, unknown>): TaskMaybe<T> {
    return new _TaskMaybe(async () => {
      const x = await this.task();
      return x.isSome() && (await f(x.unwrap())) ? x : None;
    });
  }

  narrow<U extends T>(f: (x: T) => x is U): TaskMaybe<U> {
    return new _TaskMaybe(async () => {
      const x = await this.task();
      return x.narrow(f);
    });
  }

  toTaskList<U>(this: TaskMaybe<U[]>): TaskList<U> {
    return TaskList(async () => {
      const xs = await this.task();
      return List(...(xs.isNone() ? [] : xs.unwrap()));
    });
  }

  toTaskRight<L>(leftValue: L): TaskEither<L, T> {
    return TaskEither(async () => {
      const x = await this.task();
      return x.isNone() ? Left(leftValue) : Right(x.unwrap());
    });
  }

  run(): Promise<Maybe<T>> {
    return this.task();
  }
}

TaskMaybe.from = _TaskMaybe.from;
TaskMaybe.all = _TaskMaybe.all;
