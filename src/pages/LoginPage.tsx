import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../components/common/Button';
import { useDemoSession } from '../state/DemoSessionContext';

export function LoginPage() {
  const { signIn } = useDemoSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setIsSigningIn(true);
    setError(undefined);
    const ok = await signIn(username, password);
    if (!ok) setError('Usuario o contraseña incorrectos.');
    setIsSigningIn(false);
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(280px,0.92fr)_1.08fr] bg-[#f3f3ee] max-[900px]:grid-cols-1">
      <aside className="flex flex-col justify-between bg-[#1e4331] px-10 py-10 text-white max-[900px]:min-h-[220px] max-[900px]:px-6 max-[900px]:py-8">
        <div>
          <span className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/[0.07] text-[14px] font-bold tracking-[-0.02em] text-[#c8ddcb]">
            PS
          </span>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-[#a9c0ad]">Papasud · Balcarce</p>
          <h1 className="mt-3 max-w-sm text-[34px] font-semibold leading-10 tracking-[-0.03em]">PapaStock</h1>
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-[#c2d0c5]">
            Una sola fuente de verdad para stock, trazabilidad, discrepancias y documentación de exportación.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6 text-[#d9e4da] max-[900px]:hidden">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#91aa98]">Campaña</dt>
            <dd className="mt-1 text-[15px] font-semibold">2026</dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#91aa98]">Alcance</dt>
            <dd className="mt-1 text-[15px] font-semibold">Operación + export</dd>
          </div>
        </dl>
      </aside>

      <main className="flex items-center justify-center px-8 py-12 max-[900px]:px-5">
        <section className="anim-fade-up w-full max-w-[420px] border border-[#d8dad3] bg-white p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e746b]">Acceso operativo</p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-[#20231f]">Ingresar a PapaStock</h2>
          <p className="mt-2 text-[12px] leading-5 text-[#6b7068]">
            La identidad se valida en el backend. La sesión queda en una cookie segura no accesible desde JavaScript.
          </p>

          <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-3">
            <label>
              <span className="label">Usuario</span>
              <input
                className="field mt-1 min-h-10 text-[13px]"
                autoComplete="username"
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(undefined); }}
                placeholder="Usuario operativo"
              />
            </label>
            <label>
              <span className="label">Contraseña</span>
              <input
                className="field mt-1 min-h-10 text-[13px]"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(undefined); }}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="border border-[#e4b9b4] bg-[#fdf0ee] px-3 py-2 text-[12px] text-[#943a34]" role="alert">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSigningIn || username.trim().length < 3 || password.length < 4}>
              {isSigningIn ? 'Validando acceso…' : <>Entrar <ArrowRight size={14} /></>}
            </Button>
          </form>

          <p className="mt-5 flex items-center gap-2 text-[10px] text-[#747970]">
            <LockKeyhole size={12} /> Sesión HttpOnly validada por Express
          </p>
          <p className="mt-2 flex items-center gap-2 text-[10px] text-[#747970]">
            <ShieldCheck size={12} /> Las operaciones de stock siguen validándose en el backend
          </p>
        </section>
      </main>
    </div>
  );
}
