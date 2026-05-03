import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  count: number;
}

const initialState: CounterState = {
  count: 0,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
    },
    addByAmount: (state, action: PayloadAction<number>) => {
      state.count += action.payload;
    },
  },
});

export const counterActions = counterSlice.actions;
export default counterSlice.reducer;
