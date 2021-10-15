import { StatusCode } from "../types";

export enum ProcessMessageType {
  ProcessEnd = "process-end",
  ProcessSuspend = "process-suspend",
  ProcessYield = "process-yield"
}

export type ProcessMessage<U> =
  | Readonly<{
      type: ProcessMessageType.ProcessEnd;
      statusCode: StatusCode.OK;
      resultValue: U;
    }>
  | Readonly<{
      type: ProcessMessageType.ProcessEnd;
      statusCode: StatusCode.ERROR;
    }>
  | Readonly<{
      type: ProcessMessageType.ProcessSuspend;
    }>
  | Readonly<{
      type: ProcessMessageType.ProcessYield;
    }>;
