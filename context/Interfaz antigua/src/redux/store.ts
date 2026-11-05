import { configureStore } from '@reduxjs/toolkit';
import planificationReducer from './slices/planificationSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      planification: planificationReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
