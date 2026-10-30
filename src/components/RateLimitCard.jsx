import { formatClock } from '../utils/format.js';

export default function RateLimitCard({ status, resetIn, blockedFor }) {
  if (!status) {
    return <div className="card skeleton" style={{ height: 170 }} />;
  }

  const unlimited = status.requestsPerMinuteLimit < 0;
  const limit = status.requestsPerMinuteLimit;
  const used = status.requestsThisMinute;
  const blocked = blockedFor > 0;
  const countdown = blocked ? blockedFor : resetIn;
  const segments = unlimited ? 0 : Math.min(limit, 60);
  const usedSegments = unlimited ? 0 : Math.round((Math.min(used, limit) / limit) * segments);

  return (
    <div className={`card ${blocked ? 'card-blocked' : ''}`}>
      <div className="card-head">
        <h2>Solicitudes por minuto</h2>
        {blocked && <span className="pill pill-danger">Bloqueado</span>}
      </div>

      <div className="big-number">
        {used} <small>/ {unlimited ? '∞' : limit} req</small>
      </div>

      {!unlimited && (
        <div className={`segments ${segments > 20 ? 'segments-dense' : ''}`}>
          {Array.from({ length: segments }).map((_, i) => (
            <span key={i} className={`segment ${i < usedSegments ? (blocked ? 'segment-danger' : 'segment-used') : ''}`} />
          ))}
        </div>
      )}

      <div className="countdown">
        <svg viewBox="0 0 36 36" className="countdown-ring" aria-hidden="true">
          <circle cx="18" cy="18" r="15.5" className="ring-track" />
          <circle
            cx="18" cy="18" r="15.5"
            className={`ring-fill ${blocked ? 'ring-danger' : ''}`}
            strokeDasharray={`${(countdown / 60) * 97.4} 97.4`}
          />
        </svg>
        <div>
          <div className="mono countdown-time">{formatClock(countdown)}</div>
          <div className="muted small">
            {blocked ? 'para poder volver a enviar' : 'hasta el reinicio del contador'}
          </div>
        </div>
      </div>
    </div>
  );
}
