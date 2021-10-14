import { ProcessMessage } from "./messages";

export type Lock<T> = Generator<ProcessMessage<T>, T extends void ? void : LockResult<T>, void>;

export type LockResult<T> = Readonly<{
  value: T;
}>;
