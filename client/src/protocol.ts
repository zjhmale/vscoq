'use strict';
import { RequestType, NotificationType } from 'vscode-jsonrpc';

export declare interface CoqTopParams {
  uri: string;
}
export declare interface CoqTopStepForwardResult {
  processingStart: number;
  processingEnd: number;
}
export declare interface CoqTopStepBackwardResult {
  commandStart: number;
  commandEnd: number;
}
export enum HypothesisDifference { None, Changed, New, MovedUp, MovedDown }
export enum TextDifference { None, Added, Removed }
export interface TextPartDifference {
  text: string;
  change: TextDifference;
}
export interface Hypothesis {
  identifier: string;
  relation: string;
  expression: string;
  diffExpression?: TextPartDifference[];
  diff: HypothesisDifference;
}
export interface Goal {
  id: number;
  hypotheses: Hypothesis[];
  goal: string;
  diffGoal?: TextPartDifference[];
}
export declare interface CoqTopGoalResult {
  goals?: Goal[];
  backgroundGoals?: Goal[],
  shelvedGoals?: Goal[],
  abandonedGoals?: Goal[],
  error?: FailValue;
}

export interface Location {
  start: number;
  stop: number;
}
export interface FailValue {
  message: string;
  location?: Location;
}

export interface CoqTopInterpretToPointParams extends CoqTopParams {
  offset: number;
}

export interface CoqTopResizeWindowParams extends CoqTopParams {
  columns: number;
}

export declare interface CoqTopLtacProfSetParams extends CoqTopParams {
  enabled: boolean;
}
export interface LtacProfTree {
  entry: {total: number; local: number; ncalls: number; max_total: number};
  children: {fst:string;snd:LtacProfTree}[]
}
export interface LtacProfResult {
  results: {fst:string;snd:LtacProfTree}[]
}
export namespace InterruptCoqRequest { 
  export const type: RequestType<CoqTopParams, void, void> = { method: 'coqtop/interrupt' }; 
} 
export namespace QuitCoqRequest { 
  export const type: RequestType<CoqTopParams, void, void> = { method: 'coqtop/quitCoq' }; 
} 
export namespace ResetCoqRequest { 
  export const type: RequestType<CoqTopParams, void, void> = { method: 'coqtop/resetCoq' }; 
} 
export namespace StepForwardRequest { 
  export const type: RequestType<CoqTopParams, CoqTopGoalResult, void> = { method: 'coqtop/stepForward' }; 
}
export namespace StepBackwardRequest { 
  export const type: RequestType<CoqTopParams, CoqTopGoalResult, void> = { method: 'coqtop/stepBackward' }; 
} 
export namespace InterpretToPointRequest { 
  export const type: RequestType<CoqTopInterpretToPointParams, CoqTopGoalResult, void> = { method: 'coqtop/interpretToPoint' }; 
} 
export namespace InterpretToEndRequest { 
  export const type: RequestType<CoqTopParams, CoqTopGoalResult, void> = { method: 'coqtop/interpretToEnd' }; 
} 
export namespace GoalRequest { 
  export const type: RequestType<CoqTopParams, CoqTopGoalResult, void> = { method: 'coqtop/goal' }; 
} 
export namespace QueryRequest { 
  export const type: RequestType<CoqTopQueryParams, CoqTopQueryResult, void> = { method: 'coqtop/query' }; 
} 
export enum QueryFunction { Check, Search, SearchAbout, Locate}
export declare interface CoqTopQueryParams extends CoqTopParams {
  queryFunction: QueryFunction;
  query: string;
}
export declare interface CoqTopQueryResult {
  searchResults: string;
}
export namespace ResizeWindowRequest { 
  export const type: RequestType<CoqTopResizeWindowParams, void, void> = { method: 'coqtop/resizeWindow' }; 
} 

export namespace LtacProfSetRequest { 
  export const type: RequestType<CoqTopLtacProfSetParams, void, void> = { method: 'coqtop/ltacProfSet' }; 
}

export namespace LtacProfResultsRequest { 
  export const type: RequestType<void, LtacProfResult, void> = { method: 'coqtop/ltacProfResults' }; 
}



// Parsing->Processing->Processed->[Incomplete|]
export enum HighlightType {
  Clear,         // 
  SyntaxError,   // 
  TacticFailure, // A tactic has failed
  Parsing,       // Has been sent to Coq
  Processing,    // Has been received by Coq
  Incomplete,    // Not accepted; Ex: a Qed. whose proof has failed
  Complete,      // Acceped: 
  InProgress,    // 
  Processed      // Has been (partially?) checked; syntax seems good, but might still fail...?
}

export interface Highlight {
  style: HighlightType;
  textBegin: number;
  textEnd: number;
  message?: string;
}

export declare interface NotificationParams {
  uri: string;
}

export declare interface NotifyHighlightParams extends NotificationParams {
  highlights : Highlight[];
}

export namespace UpdateHighlightsNotification { 
  export const type: NotificationType<NotifyHighlightParams> = { method: 'coqtop/updateHighlights' }; 
} 

export declare interface NotifyMessageParams extends NotificationParams {
  level: string;
  message: string;
}
export namespace CoqMessageNotification { 
  export const type: NotificationType<NotifyMessageParams> = { method: 'coqtop/message' }; 
} 


export enum ComputingStatus {Finished, Computing, Interrupted}
export declare interface NotifyComputingStatusParams extends NotificationParams {
  status: ComputingStatus;
  computeTimeMS: number;
}
export namespace CoqComputingStatusNotification { 
  export const type: NotificationType<NotifyComputingStatusParams> = { method: 'coqtop/computingStatus' }; 
} 


export namespace CoqResetNotification { 
  export const type: NotificationType<NotificationParams> = { method: 'coqtop/wasReset' }; 
} 

export interface NotifyStateViewUrlParams extends NotificationParams {
  stateUrl: string;
}

export namespace CoqStateViewUrlNotification { 
  export const type: NotificationType<NotifyStateViewUrlParams> = { method: 'coqtop/stateViewUrl' }; 
} 

