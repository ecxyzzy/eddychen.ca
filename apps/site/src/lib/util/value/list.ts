import type { SyncMonad } from "../interfaces";
import { TaskList } from "../task/task-list";

export type List<T> = _List<T>;
export const List = <T>(...xs: T[]): List<T> => new _List(...xs);

class _List<T> implements SyncMonad<T> {
  private readonly xs: ReadonlyArray<T>;

  constructor(...xs: T[]) {
    this.xs = xs;
  }

  static from<T>(xs: T[]): List<T> {
    return List(...xs);
  }

  flat<U>(this: List<List<U>>): List<U> {
    return List.from(this.xs.flatMap((x) => x.toArray()));
  }

  filter(f: (x: T) => unknown): List<T> {
    return List.from(this.xs.filter(f));
  }

  narrow<U extends T>(f: (x: T) => x is U): List<U> {
    return List.from(this.xs.filter(f));
  }

  map<U>(f: (x: T) => U): List<U> {
    return List.from(this.xs.map(f));
  }

  flatMap<U>(f: (x: T) => List<U>): List<U> {
    return List.from(this.xs.map(f)).flat();
  }

  toTask(): TaskList<T> {
    return TaskList(() => Promise.resolve(this));
  }

  toArray(): T[] {
    return [...this.xs];
  }

  toSorted(compareFn?: (a: T, b: T) => number): List<T> {
    return List(...this.xs.toSorted(compareFn));
  }

  [Symbol.iterator]() {
    return this.xs[Symbol.iterator]();
  }
}

List.from = _List.from;
