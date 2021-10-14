import { StatusCode } from "../types";
import { ProcessMessage } from "./messages";

export type ProcessResult<T> = Readonly<{
  statusCode: StatusCode;
  resultValue: T;
  tick: number;
}>;

export type ExecutableGenerator<TReturn> = Generator<ProcessMessage<TReturn>, TReturn, void>;
