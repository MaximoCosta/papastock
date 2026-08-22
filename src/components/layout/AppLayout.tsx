import { AlertTriangle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppData } from '../../state/AppDataContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const { actionError, clearActionError, dataSource, dataWarning, isLoading } = useAppData();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#f3f3ee]">
      <Sidebar />
      <Topbar />
      <main className="app-main ml-[236px] min-h-screen px-7 pb-12 pt-[86px] max-[900px]:ml-[76px]">
        <div className="mx-auto max-w-[1580px]">
          {isLoading ? (
            <section className="flex min-h-[360px] items-center justify-center border border-[#d8dad3] bg-white" aria-live="polite">
              <div className="text-center">
                <LoaderCircle className="mx-auto animate-spin text-[#315d43]" size={24} />
                <p className="mt-3 text-[12px] font-semibold text-[#374039]">Consolidando datos operativos</p>
                <p className="mt-1 text-[10px] text-[#777c74]">Ubicaciones, lotes, stock, movimientos y trazabilidad</p>
              </div>
            </section>
          ) : (
            <div key={pathname} className="anim-fade-up">
              <div className={`anim-fade-in mb-4 flex items-center justify-between border px-3 py-2 text-[10px] ${dataWarning ? 'border-[#e2c88e] bg-[#fff8e8] text-[#785716]' : 'border-[#c6d7c9] bg-[#eff5ef] text-[#365b42]'}`} role={dataWarning ? 'status' : undefined}>
                <span className="flex items-center gap-2">
                  {dataWarning ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  {dataWarning ?? `Fuente operativa conectada: ${dataSource === 'database' ? 'PostgreSQL' : 'mock'}.`}
                </span>
              </div>
              {actionError && (
                <div className="anim-fade-in mb-4 flex items-center justify-between border border-[#dfaaa4] bg-[#fdf0ee] px-3 py-2 text-[11px] text-[#81322d]" role="alert">
                  <span className="flex items-center gap-2"><AlertTriangle size={14} />{actionError} No se simuló el guardado.</span>
                  <button type="button" onClick={clearActionError} aria-label="Cerrar error" className="p-1 hover:bg-[#f4d9d6]"><X size={13} /></button>
                </div>
              )}
              <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
