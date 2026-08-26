import { AlertTriangle, Bot, Database, Send, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { askOperationsAssistant, loadOperationsAssistantStatus } from '../services/operationsAssistantService';
import type { OperationsAssistantAnswer, OperationsAssistantStatus } from '../types/operationsAssistant';

const examples = [
  '¿Cuánto stock hay de SHOW-001?',
  '¿Qué lotes tienen verificación pendiente?',
  '¿Qué movimientos están pendientes de recepción?',
  '¿Qué lotes no están conciliados con el ledger?',
];

const qualityLabel = {
  authoritative: 'Ledger autoritativo',
  operational_only: 'Stock operativo',
  incomplete: 'Datos incompletos',
} as const;

const evidenceSourceLabel = {
  stock_records: 'Stock',
  movements: 'Movimiento',
  ledger: 'Ledger',
  traceability: 'Trazabilidad',
} as const;

export function OperationsAssistantPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<OperationsAssistantAnswer>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [groqStatus, setGroqStatus] = useState<OperationsAssistantStatus>();

  useEffect(() => {
    let cancelled = false;
    void loadOperationsAssistantStatus()
      .then((status) => { if (!cancelled) setGroqStatus(status); })
      .catch(() => { if (!cancelled) setGroqStatus(undefined); });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = question.trim();
    if (prompt.length < 3 || loading) return;
    setLoading(true);
    setError('');
    setAnswer(undefined);
    try {
      setAnswer(await askOperationsAssistant(prompt));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'El asistente no está disponible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Consulta read-only"
        title="Asistente de inventario"
        description="Consulta el snapshot operativo de PostgreSQL. Groq interpreta la pregunta; los totales de stock los fija el backend. El asistente nunca modifica stock."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="border border-[#d6d9d1] bg-white shadow-[0_8px_24px_rgba(32,35,31,0.04)]">
          <div className="flex items-center justify-between border-b border-[#e1e3dd] bg-[#f8f8f4] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-[#b9cbbd] bg-[#edf4ee] text-[#28543b]"><Bot size={18} /></span>
              <div>
                <p className="text-[12px] font-bold text-[#273029]">Contexto operacional cerrado</p>
                <p className="mt-0.5 text-[10px] text-[#6d736b]">PostgreSQL → Express → Groq</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {groqStatus && (
                <StatusBadge tone={groqStatus.groqConfigured ? 'success' : 'warning'}>
                  {groqStatus.groqConfigured ? 'Groq en el servidor' : 'Groq no configurado'}
                </StatusBadge>
              )}
              <StatusBadge tone="success">Sólo lectura</StatusBadge>
            </div>
          </div>

          {groqStatus && !groqStatus.groqConfigured && (
            <div className="mx-5 mt-5 flex gap-3 border border-[#e2c48a] bg-[#fbf6ea] p-4 text-[12px] leading-5 text-[#755516]" role="status">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <div>
                <p className="font-bold text-[#5f4512]">GROQ_API_KEY no está en Express</p>
                <p className="mt-1">
                  Ponerla en el frontend (variables <code>VITE_*</code>, Netlify o el bundle de Vite) no configura Groq.
                  Tiene que estar en Render → Web Service <strong>papastock</strong> → Environment, con el nombre exacto
                  {' '}<code>GROQ_API_KEY</code>, y hay que redesplegar.
                </p>
                {groqStatus.frontendKeyIgnored && (
                  <p className="mt-1">
                    El servidor ve una <code>VITE_GROQ_API_KEY</code> y la ignora. Rotá esa clave: Vite puede haberla
                    incluido en el JavaScript del navegador.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="p-5">
            <label className="label" htmlFor="operations-question">Pregunta operativa</label>
            <textarea
              id="operations-question"
              className="field min-h-28 resize-y leading-5"
              value={question}
              maxLength={500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ej.: ¿Dónde está el lote SHOW-002?"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-[10px] text-[#777c74]">No uses este canal para confirmar movimientos o correcciones.</p>
              <Button type="submit" disabled={question.trim().length < 3 || loading}>
                <Send size={14} />{loading ? 'Consultando…' : 'Consultar'}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mx-5 mb-5 flex gap-3 border border-[#e2b9b4] bg-[#fdf0ee] p-4 text-[12px] text-[#873832]" role="alert">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <p>{error} No se usaron datos mock ni se modificó PostgreSQL.</p>
            </div>
          )}

          {answer && (
            <article className="mx-5 mb-5 border border-[#cdd7ce] bg-[#f5f8f4] p-5" aria-live="polite">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <StatusBadge tone={answer.dataQuality === 'authoritative' ? 'success' : 'warning'}>
                  {qualityLabel[answer.dataQuality]}
                </StatusBadge>
                <StatusBadge tone={answer.engine === 'heuristic' ? 'warning' : 'success'}>
                  {answer.engine === 'llm' ? 'IA · Groq' : answer.engine === 'deterministic' ? 'Hecho canónico' : answer.engine === 'heuristic' ? 'Heurística · Groq no disponible' : 'Respuesta operativa'}
                </StatusBadge>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#737970]">Confianza {answer.confidence}</span>
              </div>
              <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#283129]">{answer.answer}</p>
              {answer.warnings.length > 0 && (
                <div className="mt-5 border-l-2 border-[#c39233] pl-3">
                  {answer.warnings.map((warning) => <p key={warning} className="text-[11px] leading-5 text-[#755516]">{warning}</p>)}
                </div>
              )}
              <div className="mt-5 border-t border-[#d9dfd8] pt-4">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#70766e]">Evidencia utilizada</p>
                <ul className="space-y-1.5">
                  {answer.evidence.map((item, index) => (
                    <li key={`${item.source}-${index}`} className="flex gap-2 text-[11px] leading-4 text-[#566058]">
                      <Database className="mt-0.5 shrink-0 text-[#52705b]" size={12} />
                      <span>
                        <strong>
                          {evidenceSourceLabel[item.source]}
                          {(item.recordLabel ?? item.recordId) ? ` · ${item.recordLabel ?? item.recordId}` : ''}
                        </strong>
                        {' · '}{item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )}
        </section>

        <aside className="space-y-5">
          <section className="border border-[#d6d9d1] bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#4e5d52]"><ShieldCheck size={15} /> Alcance seguro</p>
            <ul className="space-y-2 text-[11px] leading-5 text-[#697068]">
              <li>• Responde con el snapshot autenticado actual.</li>
              <li>• Distingue stock operativo y ledger reconstruido.</li>
              <li>• No recibe credenciales, SQL ni herramientas.</li>
              <li>• No puede registrar ninguna operación.</li>
            </ul>
          </section>
          <section className="border border-[#d6d9d1] bg-[#f8f8f4] p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#626a63]">Preguntas de ejemplo</p>
            <div className="space-y-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setQuestion(example)}
                  className="w-full border border-[#daddd6] bg-white px-3 py-2.5 text-left text-[11px] leading-4 text-[#39443c] transition hover:border-[#9fb3a3] hover:bg-[#f4f8f4]"
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
