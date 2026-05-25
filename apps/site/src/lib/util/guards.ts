import type { EitherTaggedUnion, EitherTuple, RightTaggedUnion, RightTuple } from "./types";

export const isRightTuple = <L, R>(t: EitherTuple<L, R>): t is RightTuple<L, R> => !!t[1];

export const isRightTaggedUnion = <
  L,
  R,
  Tag extends string,
  LKey extends string,
  RKey extends string,
>(
  t: EitherTaggedUnion<L, R, Tag, LKey, RKey>,
  tag: Tag,
): t is RightTaggedUnion<L, R, Tag, LKey, RKey> => t[tag];
