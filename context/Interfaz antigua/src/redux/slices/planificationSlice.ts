import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PlanifTab = 'PAAC' | 'EQUIPO' | 'PEDAGOGICO' | 'DISCIPLINAR' | 'GENERAL';

interface PlanifState {
  selectedCycle: number;
  selectedCarreraId: string | null;
  activePlanifId: string | null;
  currentDocumentType: PlanifTab;
  activeObservations: Record<string, string[]>;
}

const initialState: PlanifState = {
  selectedCycle: new Date().getFullYear(),
  selectedCarreraId: null,
  activePlanifId: null,
  currentDocumentType: 'PAAC',
  activeObservations: {},
};

export const planificationSlice = createSlice({
  name: 'planification',
  initialState,
  reducers: {
    setSelectedCycle: (state, action: PayloadAction<number>) => {
      state.selectedCycle = action.payload;
    },
    setSelectedCarreraId: (state, action: PayloadAction<string | null>) => {
      state.selectedCarreraId = action.payload;
    },
    setActivePlanificacion: (state, action: PayloadAction<string | null>) => {
      state.activePlanifId = action.payload;
    },
    setDocumentType: (state, action: PayloadAction<PlanifTab>) => {
      state.currentDocumentType = action.payload;
    },
    setFieldObservation: (state, action: PayloadAction<{ path: string; message: string }>) => {
      if (!state.activeObservations[action.payload.path]) state.activeObservations[action.payload.path] = [];
      state.activeObservations[action.payload.path].push(action.payload.message);
    },
    resolveFieldObservation: (state, action: PayloadAction<string>) => {
      delete state.activeObservations[action.payload];
    },
  },
});

export const {
  setSelectedCycle,
  setSelectedCarreraId,
  setActivePlanificacion,
  setDocumentType,
  setFieldObservation,
  resolveFieldObservation,
} = planificationSlice.actions;

export default planificationSlice.reducer;
