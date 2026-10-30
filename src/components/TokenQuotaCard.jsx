import { formatDate, formatLongDuration, formatNumber } from '../utils/format.js';

export default function TokenQuotaCard({ status, resetIn, onUpgrade }) {
  if (!status) {
    return <div className="card skeleton" style={{ height: 190 }} />;
  }

  const unlimited = status.tokenLimit < 0;
  const percent = unlimited ? 0 : Math.min(100, (status.tokensUsed / status.tokenLimit) * 100);
  const level = percent >= 90 ? 'danger' : percent >= 70 ? 'warning' : 'ok';

  return (
    <div className="card">
      <div className="card-head">
        <h2>Cuota mensual de tokens</h2>
        {!unlimited && <span className={`pill pill-${level}`}>{percent.toFixed(1)}%</span>}
      </div>

      {unlimited ? (
        <>
          <div className="big-number">∞ <small>ilimitado</small></div>
          <p className="muted">Has consumido {formatNumber(status.tokensUsed)} tokens este mes.</p>
        </>
      ) : (
        <>
          <div className="big-number">
            {formatNumber(status.tokensUsed)} <small>/ {formatNumber(status.tokenLimit)} tokens</small>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`progress-fill progress-${level}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="stat-row">
            <span>Disponibles</span>
            <strong>{formatNumber(status.tokensRemaining)}</strong>
          </div>
        </>
      )}

      <div className="reset-box">
        <span className="muted">Se renueva el {formatDate(status.resetDate)}</span>
        <span className="mono">en {formatLongDuration(resetIn)}</span>
      </div>

      {!unlimited && percent >= 80 && (
        <button className="btn btn-outline btn-block" onClick={onUpgrade}>
          {percent >= 100 ? 'Cuota agotada · Mejorar plan' : 'Te queda poca cuota · Mejorar plan'}
        </button>
      )}
    </div>
  );
}
