export type Neither<T, U> = { [P in keyof T | keyof U]?: never };
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type NAND<T, U> =
  | (Without<T, U> & U)
  | (Without<U, T> & T)
  | Neither<T, U>;
