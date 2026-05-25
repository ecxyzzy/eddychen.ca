export type Nullish = null | undefined;
export type Nullable<T> = T | Nullish;

export type LeftTuple<L, R> = [L, null];
export type RightTuple<L, R> = [null, R];
export type EitherTuple<L, R> = LeftTuple<L, R> | RightTuple<L, R>;

export type LeftTaggedUnion<
  L,
  _R,
  Tag extends string,
  LKey extends string,
  _RKey extends string,
> = Record<Tag, false> & Record<LKey, L>;
export type RightTaggedUnion<
  _L,
  R,
  Tag extends string,
  _LKey extends string,
  RKey extends string,
> = Record<Tag, true> & Record<RKey, R>;
export type EitherTaggedUnion<L, R, Tag extends string, LKey extends string, RKey extends string> =
  | LeftTaggedUnion<L, R, Tag, LKey, RKey>
  | RightTaggedUnion<L, R, Tag, LKey, RKey>;

export type MaybeAsyncFn<I, O> = (x: I) => O | Promise<O>;
