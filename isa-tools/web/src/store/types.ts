import { Action, Reducer } from '@reduxjs/toolkit';

import { AppState } from './state/types';

type RequiredKeys<T> = {
  [K in keyof T]-?: unknown extends Pick<T, K> ? never : K;
}[keyof T];

export type RequiredRootState = Required<RootState>;

export type RootStateKeyType = keyof RootState;

export type StaticReducersType = {
  [P in RequiredKeys<RootState>]: Reducer<RootState[P], Action>;
};

/* 
  Because we inject your reducers asynchronously somewhere in your code
  You have to declare them here manually :(
*/
export interface RootState {
  api: any;
  app: AppState;
}
