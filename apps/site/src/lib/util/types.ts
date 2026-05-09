export type Nullish = null | undefined;

export type Nullable<T> = T | Nullish;

export type EitherTuple<L, R> = [L, null] | [null, R];
