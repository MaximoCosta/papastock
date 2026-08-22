import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { TransporterProfileCard } from '../components/transporters/TransporterProfileCard';
import { formatKg } from '../lib/formatters';
import type { TransporterInput } from '../state/AppDataContext';
import { useAppData } from '../state/AppDataContext';
import type { Transporter } from '../types/domain';
import { Plus, Truck } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

const emptyForm: TransporterInput = {
  companyName: '',
  tradeName: '',
  cuit: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  province: 'Buenos Aires',
  licensePlate: '',
  vehicleType: 'Semirremolque refrigerado',
  capacityKg: 25000,
  insurancePolicy: '',
  notes: '',
  active: true,
};

export function TransportersPage() {
  const { transporters, addTransporter, updateTransporter } = useAppData();
  const [selectedId, setSelectedId] = useState<string | undefined>(transporters[0]?.id);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<TransporterInput>(emptyForm);

  const selected = useMemo(
    () => transporters.find((item) => item.id === selectedId) ?? transporters[0],
    [selectedId, transporters],
  );

  function startCreate() {
    setCreating(true);
    setEditing(false);
    setForm(emptyForm);
  }

  function startEdit(transporter: Transporter) {
    setCreating(false);
    setEditing(true);
    setSelectedId(transporter.id);
    const { id: _id, ...rest } = transporter;
    setForm(rest);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.companyName.trim() || !form.cuit.trim() || !form.licensePlate.trim()) return;

    if (creating) {
      const created = addTransporter({
        ...form,
        companyName: form.companyName.trim(),
        cuit: form.cuit.trim(),
        licensePlate: form.licensePlate.trim().toUpperCase(),
      });
      setSelectedId(created.id);
      setCreating(false);
    } else if (editing && selected) {
      updateTransporter(selected.id, {
        ...form,
        companyName: form.companyName.trim(),
        cuit: form.cuit.trim(),
        licensePlate: form.licensePlate.trim().toUpperCase(),
      });
      setEditing(false);
    }
  }

  const showForm = creating || editing;

  return (
    <>
      <PageHeader
        eyebrow="Logística"
        title="Transportistas"
        description="Perfiles con datos fiscales, contacto y flota para reutilizar en movimientos y exportaciones."
        actions={<Button onClick={startCreate}><Plus size={14} /> Nuevo transportista</Button>}
      />

      <div className="grid grid-cols-[0.95fr_1.05fr] gap-4 max-[1100px]:grid-cols-1">
        <div className="overflow-hidden border border-[#d8dad3] bg-white">
          <table className="operational-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Patente</th>
                <th>Capacidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {transporters.map((transporter) => {
                const isActive = transporter.id === selected?.id;
                return (
                  <tr
                    key={transporter.id}
                    className={`cursor-pointer ${isActive ? 'bg-[#eef2eb]' : ''}`}
                    onClick={() => {
                      setSelectedId(transporter.id);
                      setCreating(false);
                      setEditing(false);
                    }}
                  >
                    <td>
                      <p className="font-bold text-[#284332]">{transporter.tradeName || transporter.companyName}</p>
                      <p className="mt-0.5 text-[10px] text-[#747970]">{transporter.cuit}</p>
                    </td>
                    <td className="tabular font-semibold">{transporter.licensePlate}</td>
                    <td className="tabular">{formatKg(transporter.capacityKg)}</td>
                    <td>
                      <StatusBadge tone={transporter.active ? 'success' : 'neutral'}>
                        {transporter.active ? 'Activo' : 'Inactivo'}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          {showForm ? (
            <form onSubmit={submit} className="border border-[#d8dad3] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Truck size={16} className="text-[#315d43]" />
                <h2 className="text-sm font-semibold text-[#2d332e]">
                  {creating ? 'Nuevo perfil' : 'Editar perfil'}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
                <label>
                  <span className="label">Razón social</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Nombre comercial</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.tradeName ?? ''} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
                </label>
                <label>
                  <span className="label">CUIT</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Contacto</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Teléfono</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Email</span>
                  <input className="field mt-1 min-h-10 text-[12px]" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </label>
                <label className="col-span-2 max-[700px]:col-span-1">
                  <span className="label">Domicilio</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Ciudad</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Provincia</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Patente</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Tipo de vehículo</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} required />
                </label>
                <label>
                  <span className="label">Capacidad (kg)</span>
                  <input className="field mt-1 min-h-10 text-[12px]" type="number" min={1} value={form.capacityKg || ''} onChange={(e) => setForm({ ...form, capacityKg: Number(e.target.value) })} required />
                </label>
                <label>
                  <span className="label">Póliza de seguro</span>
                  <input className="field mt-1 min-h-10 text-[12px]" value={form.insurancePolicy ?? ''} onChange={(e) => setForm({ ...form, insurancePolicy: e.target.value })} />
                </label>
                <label className="col-span-2 max-[700px]:col-span-1">
                  <span className="label">Notas</span>
                  <textarea className="field mt-1 min-h-20 text-[12px]" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Transportista activo
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit">{creating ? 'Crear perfil' : 'Guardar cambios'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setCreating(false); setEditing(false); }}>Cancelar</Button>
              </div>
            </form>
          ) : selected ? (
            <>
              <TransporterProfileCard transporter={selected} />
              <Button variant="secondary" onClick={() => startEdit(selected)}>Editar perfil</Button>
            </>
          ) : (
            <div className="border border-[#d8dad3] bg-white px-5 py-10 text-center text-[12px] text-[#747970]">
              Todavía no hay transportistas cargados.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
