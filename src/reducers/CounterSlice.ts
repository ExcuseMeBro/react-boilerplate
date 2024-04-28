import { createSlice } from '@reduxjs/toolkit';

interface CounterInitialStateType {
  count: number;
}

const initialState: CounterInitialStateType = {
  count: 0,
};

const CounterSlice = createSlice({
  name: 'counterSlice',
  initialState,
  reducers: {
    incrementNumber: (state) => {
      state.count += 1;
    },
    incrementUserValue: (state, action) => {
      state.count += action.payload;
    },
  },
});

export const CounterServices = {
  actions: CounterSlice.actions,
};

const CounterReducer = CounterSlice.reducer;
export default CounterReducer;
