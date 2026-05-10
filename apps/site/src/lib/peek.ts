export function peek<T>(x: T): T {
  console.dir(x, { depth: null });
  return x;
}
