import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from '@/features/auth/slice';
import counterReducer from '@/reducers/CounterSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    counter: counterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
