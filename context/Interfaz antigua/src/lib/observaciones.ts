import { PlanifStatus } from '@prisma/client';

export const ESTADOS_OBSERVABLES: PlanifStatus[] = [
  'ENVIADO_A_REVISION',
  'APROBADO_PEDAGOGICO',
  'APROBADO_DISCIPLINAR',
];

export function permiteObservaciones(estado: string) {
  return ESTADOS_OBSERVABLES.includes(estado as PlanifStatus);
}

export function tieneObservacionesPendientes(observaciones: readonly { resuelto: boolean }[]) {
  return observaciones.some((observacion) => !observacion.resuelto);
}
