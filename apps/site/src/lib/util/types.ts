export type Nullish = null | undefined;

export type Nullable<T> = T | Nullish;

export type EitherTuple<L, R> = [L, null] | [null, R];

export type EitherTaggedUnion<L, R> = { success: true; data: R } | { success: false; error: L };
