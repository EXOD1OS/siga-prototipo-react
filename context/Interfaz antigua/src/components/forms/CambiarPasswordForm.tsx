'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { cambiarPassword } from '@/actions/auth.actions';

export function CambiarPasswordForm() {
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await cambiarPassword(nueva);
      await signOut({ callbackUrl: '/login?passwordChanged=1' });
    } catch (err: any) {
      setError(err.message ?? 'No se pudo cambiar la contraseña.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Nueva contraseña</label>
        <input type="password" required className="w-full" value={nueva} onChange={(e) => setNueva(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Confirmar contraseña</label>
        <input type="password" required className="w-full" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover transition-colors rounded-lg py-2 text-white font-medium disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar y volver a ingresar'}
      </button>
    </form>
  );
}
