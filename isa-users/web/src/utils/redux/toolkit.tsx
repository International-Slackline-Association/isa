import {
  CreateSliceOptions,
  SliceCaseReducers,
  createSlice as createSliceOriginal,
} from '@reduxjs/toolkit';
import { RootStateKeyType } from 'store/types';

/* istanbul ignore next */
export const createSlice = <
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends RootStateKeyType,
>(
  options: CreateSliceOptions<State, CaseReducers, Name>,
) => {
  return createSliceOriginal(options);
};
