import type { MaybeAsyncFn } from "@lib/util/types";

export interface Runnable<T> {
  run(): Promise<T>;
}

export interface SyncMonad<T> {
  map<U>(f: (x: T) => U): SyncMonad<U>;
  flatMap<U>(f: (x: T) => SyncMonad<U>): SyncMonad<U>;
}

export interface SyncMonad2<L, R> {
  map<T>(f: (x: R) => T): SyncMonad2<L, T>;
  flatMap<T>(f: (x: R) => SyncMonad2<L, T>): SyncMonad2<L, T>;
}

export interface AsyncMonad<T> {
  map<U>(f: MaybeAsyncFn<T, U>): AsyncMonad<U>;
  flatMap<U>(f: (x: T) => AsyncMonad<U>): AsyncMonad<U>;
}

export interface AsyncMonad2<L, R> {
  map<T>(f: MaybeAsyncFn<R, T>): AsyncMonad2<L, T>;
  flatMap<T>(f: (x: R) => AsyncMonad2<L, T>): AsyncMonad2<L, T>;
}
