import type { AsyncMonad, Runnable } from "../interfaces";
import type { MaybeAsyncFn } from "../types";
import { List } from "../value/list";
import { Maybe, None } from "../value/maybe";
import { TaskMaybe } from "./task-maybe";

export type TaskList<T> = _TaskList<T>;
export const TaskList = <T>(f: () => Promise<List<T>>): TaskList<T> => new _TaskList(f);

class _TaskList<T> implements AsyncMonad<T>, Runnable<List<T>> {
  constructor(private readonly task: () => Promise<List<T>>) {}

  filter(f: MaybeAsyncFn<T, unknown>): TaskList<T> {
    return TaskList(async () => {
      const xs = await this.task();
      const ys: T[] = [];
      for (const x of xs) {
        if (await f(x)) {
          ys.push(x);
        }
      }
      return List.from(ys);
    });
  }

  narrow<U extends T>(f: (x: T) => x is U): TaskList<U> {
    return TaskList(async () => (await this.task()).narrow(f));
  }

  find(f: MaybeAsyncFn<T, unknown>): TaskMaybe<T> {
    return TaskMaybe(async () => {
      const xs = await this.task();
      for (const x of xs) {
        if (await f(x)) {
          return Maybe(x);
        }
      }
      return None;
    });
  }

  map<U>(f: MaybeAsyncFn<T, U>): TaskList<U> {
    return TaskList(async () => {
      const xs = await this.task();
      return List(...(await Promise.all(xs.map(f))));
    });
  }

  mapSeq<U>(f: MaybeAsyncFn<T, U>): TaskList<U> {
    return TaskList(async () => {
      const xs = await this.task();
      const ys: U[] = [];
      for (const x of xs) {
        ys.push(await f(x));
      }
      return List.from(ys);
    });
  }

  flatMap<U>(f: (x: T) => TaskList<U>): TaskList<U> {
    return TaskList(async () => {
      const xs = await this.task();
      return List(
        ...(await Promise.all(xs.map(f).map((x) => x.run()))).flatMap((x) => x.toArray()),
      );
    });
  }

  flatMapSeq<U>(f: (x: T) => TaskList<U>): TaskList<U> {
    return TaskList(async () => {
      const xs = await this.task();
      const ys: U[] = [];
      for (const x of xs) {
        ys.push(...(await f(x).run()));
      }
      return List.from(ys);
    });
  }

  toSorted(compareFn?: (a: T, b: T) => number): TaskList<T> {
    return TaskList(async () => (await this.task()).toSorted(compareFn));
  }

  run(): Promise<List<T>> {
    return this.task();
  }
}
