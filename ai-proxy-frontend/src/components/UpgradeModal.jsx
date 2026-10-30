import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatNumber } from '../utils/format.js';
import PlanBadge from './PlanBadge.jsx';

const PLAN_ORDER = ['FREE', 'PRO', 'ENTERPRISE'];

const FALLBACK_PLANS = [
  { plan: 'FREE', requestsPerMinute: 10, monthlyTokens: 50000, monthlyPrice: 0 },
  { plan: 'PRO', requestsPerMinute: 60, monthlyTokens: 500000, monthlyPrice: 19.99 },
  { plan: 'ENTERPRISE', requestsPerMinute: -1, monthlyTokens: -1, monthlyPrice: 99.99 },
];

const formatCard = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

export default function UpgradeModal({ userId, currentPlan, reason, onClose, onUpgraded }) {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const available = plans.filter((p) => PLAN_ORDER.indexOf(p.plan) > PLAN_ORDER.indexOf(currentPlan));
  const [selected, setSelected] = useState(currentPlan === 'FREE' ? 'PRO' : 'ENTERPRISE');
  const [step, setStep] = useState('choose');
  const [card, setCard] = useState({ holder: '', number: '', expiry: '', cvv: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    api.plans(userId).then((d) => setPlans(d?.length ? d : FALLBACK_PLANS)).catch(() => setPlans(FALLBACK_PLANS));
  }, [userId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && step !== 'processing' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const selectedPlan = plans.find((p) => p.plan === selected);
  const digits = card.number.replace(/\D/g, '');
  const cardValid = card.holder.trim().length >= 3 && digits.length === 16 && /^\d{2}\/\d{2}$/.test(card.expiry) && /^\d{3,4}$/.test(card.cvv);

  const pay = async (event) => {
    event.preventDefault();
    if (!cardValid) return;
    setError(null);
    setStep('processing');
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const result = await api.upgrade(userId, selected, card.holder.trim(), digits.slice(-4));
      onUpgraded(result);
      setStep('done');
      setTimeout(onClose, 1400);
    } catch (e) {
      setError(e.message || 'No se pudo procesar el pago.');
      setStep('pay');
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => step !== 'processing' && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} disabled={step === 'processing'} aria-label="Cerrar">×</button>

        {step === 'choose' && (
          <>
            <h2>{reason === 'quota' ? 'Agotaste tu cuota mensual' : 'Mejora tu plan'}</h2>
            <p className="muted">
              Plan actual: <PlanBadge plan={currentPlan} size="sm" />. {reason === 'quota' ? 'Para seguir usando la IA este mes, elige un plan superior.' : 'Obtén más solicitudes por minuto y más tokens al mes.'}
            </p>
            <div className="plan-options">
              {available.map((p) => (
                <button key={p.plan} className={`plan-option ${selected === p.plan ? 'plan-option-active' : ''}`} onClick={() => setSelected(p.plan)}>
                  <PlanBadge plan={p.plan} size="sm" />
                  <div className="plan-price">${p.monthlyPrice.toFixed(2)} <small>/ mes</small></div>
                  <ul>
                    <li>{p.requestsPerMinute < 0 ? 'Solicitudes ilimitadas' : `${p.requestsPerMinute} solicitudes / minuto`}</li>
                    <li>{p.monthlyTokens < 0 ? 'Tokens ilimitados' : `${formatNumber(p.monthlyTokens)} tokens / mes`}</li>
                  </ul>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setStep('pay')} disabled={!selectedPlan}>Continuar al pago</button>
          </>
        )}

        {(step === 'pay' || step === 'processing') && selectedPlan && (
          <form onSubmit={pay}>
            <h2>Pago simulado</h2>
            <p className="muted">Plan <PlanBadge plan={selected} size="sm" /> · <strong>${selectedPlan.monthlyPrice.toFixed(2)} USD / mes</strong></p>
            <div className="sim-note">Es una simulación: no se realiza ningún cobro y solo se envían al servidor los últimos 4 dígitos.</div>
            <label className="field">
              <span>Titular de la tarjeta</span>
              <input value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} placeholder="Nombre como aparece en la tarjeta" disabled={step === 'processing'} />
            </label>
            <label className="field">
              <span>Número de tarjeta</span>
              <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="4242 4242 4242 4242" inputMode="numeric" className="mono" disabled={step === 'processing'} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Vencimiento</span>
                <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/AA" inputMode="numeric" className="mono" disabled={step === 'processing'} />
              </label>
              <label className="field">
                <span>CVV</span>
                <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" inputMode="numeric" className="mono" disabled={step === 'processing'} />
              </label>
            </div>
            {error && <div className="banner banner-danger">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('choose')} disabled={step === 'processing'}>Atrás</button>
              <button type="submit" className="btn btn-primary" disabled={!cardValid || step === 'processing'}>
                {step === 'processing' ? <><span className="spinner" /> Procesando pago…</> : `Pagar $${selectedPlan.monthlyPrice.toFixed(2)}`}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="done">
            <div className="done-icon">✓</div>
            <h2>¡Pago aprobado!</h2>
            <p className="muted">Ya tienes el plan <PlanBadge plan={selected} size="sm" />.</p>
          </div>
        )}
      </div>
    </div>
  );
}
