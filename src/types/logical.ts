export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T);
export type NOR<T, U> = { [P in keyof T | keyof U]?: never };
export type NAND<T, U> = XOR<T, U> | NOR<T, U>;
