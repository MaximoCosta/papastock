import {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PackageSearch,
  Route,
  Truck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppData } from '../../state/AppDataContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stock', label: 'Stock', icon: Boxes },
  { to: '/lots', label: 'Lotes', icon: PackageSearch },
  { to: '/movements/new', label: 'Mover stock', icon: Route },
  { to: '/transporters', label: 'Transportistas', icon: Truck },
  { to: '/exports/new', label: 'Exportaciones', icon: ClipboardList },
  { to: '/documents', label: 'Documentos', icon: FileText },
];

export function Sidebar() {
  const { dataSource, isLoading } = useAppData();

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-30 flex w-[236px] flex-col border-r border-[#173629] bg-[#1e4331] text-white max-[900px]:w-[76px]">
      <div className="flex h-[78px] items-center gap-3 border-b border-white/10 px-5 max-[900px]:justify-center max-[900px]:px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/20 bg-white/[0.07] text-[13px] font-bold tracking-[-0.02em] text-[#c8ddcb]">
          PS
        </span>
        <div className="max-[900px]:hidden">
          <p className="text-[17px] font-semibold tracking-[-0.02em]">PapaStock</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a9c0ad]">Papasud</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5" aria-label="Navegación principal">
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-[#91aa98] max-[900px]:hidden">Operaciones</p>
        <div className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `relative flex h-10 items-center gap-3 rounded-[4px] border-l-2 px-3 text-[12px] font-medium transition-colors max-[900px]:justify-center max-[900px]:px-2 ${
                  isActive
                    ? 'border-[#b5cfb8] bg-white/[0.11] text-white'
                    : 'border-transparent text-[#c2d0c5] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className="max-[900px]:hidden">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 px-5 py-4 max-[900px]:px-2">
        <div className="flex items-center gap-2.5 max-[900px]:justify-center">
          <span className={`h-2 w-2 rounded-full ${dataSource === 'database' ? 'bg-[#99c7a2]' : 'bg-[#e0bd72]'}`} />
          <div className="max-[900px]:hidden">
            <p className="text-[10px] font-semibold text-[#d9e4da]">Entorno de demo</p>
            <p className="mt-0.5 text-[9px] text-[#91aa98]">{isLoading ? 'Consolidando datos…' : dataSource === 'database' ? 'PostgreSQL · conectado' : 'Fallback mock · temporal'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
