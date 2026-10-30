import { useEffect, useRef, useState } from 'react';
import { AVERAGE_RESPONSE_TOKENS, estimateTokens, formatClock, formatNumber } from '../utils/format.js';

const SUGGESTIONS = [
  '¿Qué es el patrón Proxy?',
  'Explícame qué es un token en IA',
  '¿Por qué limitar las peticiones por minuto?',
];

export default function Chat({ messages, sending, blockedFor, quotaExhausted, status, onSend, onUpgrade }) {
  const [prompt, setPrompt] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const blocked = blockedFor > 0;
  const promptTokens = estimateTokens(prompt);
  const totalEstimate = promptTokens ? promptTokens + AVERAGE_RESPONSE_TOKENS : 0;
  const remaining = status && status.tokenLimit > 0 ? status.tokensRemaining : null;
  const exceedsRemaining = remaining !== null && promptTokens > 0 && totalEstimate > remaining;
  const disabled = sending || blocked || quotaExhausted || !prompt.trim() || !status;

  const submit = (event) => {
    event?.preventDefault();
    if (disabled) return;
    onSend(prompt.trim());
    setPrompt('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  let buttonLabel = 'Enviar';
  if (sending) buttonLabel = 'Generando…';
  else if (blocked) buttonLabel = `Espera ${formatClock(blockedFor)}`;
  else if (quotaExhausted) buttonLabel = 'Cuota agotada';

  return (
    <div className="card chat">
      <div className="card-head">
        <h2>Chat con la IA simulada</h2>
        <span className="muted small">modelo: mock-gpt-1.0</span>
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Escribe un mensaje para empezar. Cada solicitud pasa por el proxy de rate limit y luego por el de cuota antes de llegar al servicio de IA.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => setPrompt(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`message message-${m.role} ${m.tone ? `message-${m.tone}` : ''}`}>
            <div className="message-bubble">{m.text}</div>
            {m.meta && (
              <div className="message-meta">
                {formatNumber(m.meta.promptTokens)} prompt + {formatNumber(m.meta.completionTokens)} respuesta = <strong>{formatNumber(m.meta.totalTokens)} tokens</strong> · {(m.meta.latencyMs / 1000).toFixed(1)} s
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="message message-assistant">
            <div className="message-bubble typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {blocked && (
        <div className="banner banner-warning">
          Alcanzaste el límite de {status?.requestsPerMinuteLimit} solicitudes por minuto. El envío se habilita en <strong className="mono">{formatClock(blockedFor)}</strong>.
        </div>
      )}
      {quotaExhausted && (
        <div className="banner banner-danger">
          Agotaste tu cuota mensual de tokens.
          <button className="link" onClick={onUpgrade}>Mejorar plan</button>
        </div>
      )}

      <form className="composer" onSubmit={submit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pregúntale lo que quieras a la IA…"
          rows={3}
          maxLength={4000}
        />
        <div className="composer-footer">
          <div className={`estimator ${exceedsRemaining ? 'estimator-warning' : ''}`}>
            {promptTokens > 0 ? (
              <>
                Consumo estimado: <strong>≈ {formatNumber(totalEstimate)} tokens</strong>
                <span className="muted"> ({formatNumber(promptTokens)} del prompt + ~{AVERAGE_RESPONSE_TOKENS} de respuesta)</span>
                {exceedsRemaining && <span> · supera tus tokens disponibles</span>}
              </>
            ) : (
              <span className="muted">El estimador de tokens aparece mientras escribes · Enter para enviar</span>
            )}
          </div>
          <button type="submit" className={`btn ${blocked || quotaExhausted ? 'btn-disabled-state' : 'btn-primary'}`} disabled={disabled}>
            {buttonLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
