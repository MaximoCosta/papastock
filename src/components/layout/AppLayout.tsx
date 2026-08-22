import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f3f3ee]">
      <Sidebar />
      <Topbar />
      <main className="app-main ml-[236px] min-h-screen px-7 pb-12 pt-[86px] max-[900px]:ml-[76px]">
        <div className="mx-auto max-w-[1580px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
