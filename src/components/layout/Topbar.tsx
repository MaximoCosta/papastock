import { CircleUserRound } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const sectionTitles: Record<string, string> = {
  '/': 'Control operativo',
  '/stock': 'Stock consolidado',
  '/stock/control': 'Control de stock',
  '/locations': 'Ubicaciones',
  '/warehouse': 'Modelo de depósito',
  '/lots': 'Lotes y trazabilidad',
  '/movements': 'Movimientos',
  '/movements/new': 'Movimiento de stock',
  '/transporters': 'Transportistas',
  '/exports/new': 'Preparación de exportación',
  '/documents': 'Documentación emitida',
};

export function Topbar() {
  const { pathname } = useLocation();
  const title = pathname.startsWith('/lots/')
    ? 'Detalle de lote'
    : pathname.startsWith('/documents/')
      ? 'Documento de exportación'
      : sectionTitles[pathname] ?? 'PapaStock';

  return (
    <header className="app-topbar fixed left-[236px] right-0 top-0 z-20 flex h-[60px] items-center justify-between border-b border-[#d9dbd4] bg-white px-7 max-[900px]:left-[76px]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#7c8179]">PapaStock</span>
        <span className="h-4 w-px bg-[#d7d9d2]" />
        <span className="text-[12px] text-[#454a44]">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[11px] font-semibold text-[#373c36]">Demo Papasud</p>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#96552b]">Confianza desde el origen</p>
        </div>
        <CircleUserRound size={21} className="text-[#526158]" strokeWidth={1.6} />
      </div>
    </header>
  );
}

