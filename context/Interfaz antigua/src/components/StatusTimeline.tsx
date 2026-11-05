interface Props {
  estado: string;
  pedagogicoFavorable: boolean;
  disciplinarFavorable: boolean;
  numeroExpediente: string | null;
  numeroResolucion: string | null;
}

const STATE_ORDER: Record<string, number> = {
  BORRADOR: 0,
  OBSERVADO: 1,
  ENVIADO_A_REVISION: 1,
  APROBADO_PEDAGOGICO: 2,
  APROBADO_DISCIPLINAR: 2,
  APROBADO_PLENO: 3,
  ELEVADO_AL_CONSEJO: 4,
  FINALIZADO: 5,
};

function StepCircle({ status }: { status: 'done' | 'current' | 'pending' }) {
  const styles = {
    done: 'bg-success text-white border-success',
    current: 'bg-primary/20 text-primary border-primary',
    pending: 'bg-transparent text-gray-600 border-border',
  };
  return (
    <div
      className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${styles[status]}`}
    >
      {status === 'done' ? '✓' : ''}
    </div>
  );
}

export function StatusTimeline({ estado, pedagogicoFavorable, disciplinarFavorable, numeroExpediente, numeroResolucion }: Props) {
  const currentIndex = STATE_ORDER[estado] ?? 0;

  function statusFor(i: number): 'done' | 'current' | 'pending' {
    if (currentIndex > i) return 'done';
    if (currentIndex === i) return 'current';
    return 'pending';
  }

  const steps = [
    { label: 'Borrador' },
    { label: 'Enviado a Revisión' },
    { label: 'Aprobación UAP / Dirección' },
    { label: 'Aprobado Pleno' },
    { label: 'Elevado al Consejo', sub: numeroExpediente ? `Expediente N° ${numeroExpediente}` : undefined },
    { label: 'Finalizado', sub: numeroResolucion ? `Resolución N° ${numeroResolucion}` : undefined },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      {estado === 'OBSERVADO' && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-950/20 border border-warning/40 rounded-lg px-3 py-2">
          <span>⚠</span>
          <span>Observado — la planificación requiere correcciones antes de poder reenviarse a revisión.</span>
        </div>
      )}
      <div className="flex items-start">
        {steps.map((step, i) => (
          <div key={step.label} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div
                className={`absolute top-3 right-1/2 w-full h-0.5 z-0 ${
                  statusFor(i - 1) === 'done' && (currentIndex > i - 1) ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
            <StepCircle status={statusFor(i)} />
            <p className={`mt-2 text-[11px] text-center leading-tight ${statusFor(i) === 'pending' ? 'text-gray-600' : 'text-gray-300'}`}>
              {step.label}
            </p>
            {step.sub && <p className="text-[10px] text-emerald-400 mt-0.5">{step.sub}</p>}
            {i === 2 && (
              <div className="mt-1 flex gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${pedagogicoFavorable ? 'border-success/50 text-emerald-400' : 'border-border text-gray-600'}`}>
                  UAP {pedagogicoFavorable ? '✓' : '○'}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${disciplinarFavorable ? 'border-success/50 text-emerald-400' : 'border-border text-gray-600'}`}>
                  Dirección {disciplinarFavorable ? '✓' : '○'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
