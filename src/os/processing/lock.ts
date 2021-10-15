import { ProcessMessage } from "./messages";

export type Lock<T> = Generator<ProcessMessage<T>, LockResult<T>, void>;

export type LockResult<T> = Readonly<{
  value: T;
}>;
