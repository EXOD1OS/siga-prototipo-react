import type { CSSProperties } from 'react';

/**
 * Logo UNLaR sin fondo y en el verde del tema.
 * `public/unlar-logo-verde.png` es el logo original con fondo transparente (alfa calculado sobre la tinta,
 * conserva el anti-aliasing). Se usa como máscara sobre `bg-primary`, así toma #157b79 en modo claro
 * y #14b8a6 en modo oscuro sin duplicar archivos.
 */
const MASCARA: CSSProperties = {
  WebkitMaskImage: 'url(/unlar-logo-verde.png)',
  maskImage: 'url(/unlar-logo-verde.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
};

export function UnlarLogo({ className = 'h-16' }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Universidad Nacional de La Rioja"
      // Proporción del archivo (1400 × 513) para que el ancho acompañe a la altura indicada.
      className={`block aspect-[1400/513] w-auto bg-primary ${className}`}
      style={MASCARA}
    />
  );
}
