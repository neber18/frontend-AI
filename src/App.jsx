import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api/client.js';
import useNow from './hooks/useNow.js';
import Header from './components/Header.jsx';
import TokenQuotaCard from './components/TokenQuotaCard.jsx';
import RateLimitCard from './components/RateLimitCard.jsx';
import Chat from './components/Chat.jsx';
import UsageChart from './components/UsageChart.jsx';
import UpgradeModal from './components/UpgradeModal.jsx';
import Toast from './components/Toast.jsx';

const STORAGE_KEY = 'ai-proxy-user-id';
const POLL_MS = 5000;

const readStoredUser = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeUser = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    return;
  }
};

const randomUser = () => `usuario-${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  const [userId, setUserId] = useState(() => readStoredUser() || randomUser());
  const [status, setStatus] = useState(null);
  const [statusFetchedAt, setStatusFetchedAt] = useState(Date.now());
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [toast, setToast] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const now = useNow(250);
  const userRef = useRef(userId);

  useEffect(() => {
    userRef.current = userId;
    storeUser(userId);
  }, [userId]);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await api.status(userRef.current);
      if (data.userId !== userRef.current) return;
      setStatus(data);
      setStatusFetchedAt(Date.now());
      setConnectionError(false);
    } catch (error) {
      if (error.status === 0) setConnectionError(true);
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await api.history(userRef.current));
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    setStatus(null);
    setHistory([]);
    setMessages([]);
    setBlockedUntil(null);
    refreshStatus();
    refreshHistory();
    const id = setInterval(refreshStatus, POLL_MS);
    return () => clearInterval(id);
  }, [userId, refreshStatus, refreshHistory]);

  const elapsed = (now - statusFetchedAt) / 1000;
  const rateResetIn = status ? Math.max(0, status.rateLimitResetSeconds - elapsed) : 0;
  const monthlyResetIn = status ? Math.max(0, status.secondsUntilReset - elapsed) : 0;
  const blockedFor = blockedUntil ? Math.max(0, (blockedUntil - now) / 1000) : 0;
  const quotaExhausted = status && !status.unlimited && status.tokenLimit > 0 && status.tokensRemaining <= 0;

  const lastRateWindowRef = useRef(null);
  useEffect(() => {
    if (status && rateResetIn <= 0 && lastRateWindowRef.current !== statusFetchedAt) {
      lastRateWindowRef.current = statusFetchedAt;
      refreshStatus();
    }
  }, [rateResetIn, status, statusFetchedAt, refreshStatus]);

  useEffect(() => {
    if (blockedUntil && now >= blockedUntil) {
      setBlockedUntil(null);
      refreshStatus();
    }
  }, [now, blockedUntil, refreshStatus]);

  const closeToast = useCallback(() => setToast(null), []);
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), []);

  const openUpgrade = (reason = null) => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  };

  const sendPrompt = async (prompt) => {
    const userMessage = { id: crypto.randomUUID(), role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    try {
      const response = await api.generate(userId, prompt);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: response.text, meta: response }]);
    } catch (error) {
      if (error.status === 429) {
        const seconds = error.retryAfter || 60;
        setBlockedUntil(Date.now() + seconds * 1000);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'system', tone: 'warning', text: `Límite de solicitudes por minuto alcanzado (429). Podrás enviar de nuevo en ${seconds} s.` },
        ]);
      } else if (error.status === 402) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'system', tone: 'danger', text: 'Cuota mensual de tokens agotada (402). Mejora tu plan para continuar.' },
        ]);
        openUpgrade('quota');
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'system', tone: 'danger', text: error.status === 0 ? 'No se pudo conectar con el servidor.' : `Error: ${error.message}` },
        ]);
      }
    } finally {
      setSending(false);
      refreshStatus();
      refreshHistory();
    }
  };

  const handleUpgraded = (result) => {
    setStatus(result.status);
    setStatusFetchedAt(Date.now());
    setBlockedUntil(null);
    setToast(`¡Pago aprobado! Ahora tienes el plan ${result.currentPlan}. Transacción ${result.transactionId}.`);
    refreshHistory();
  };

  return (
    <div className="app">
      <Header status={status} userId={userId} onChangeUser={setUserId} onUpgrade={() => openUpgrade()} />

      {connectionError && (
        <div className="banner banner-danger">No hay conexión con el backend. Reintentando cada {POLL_MS / 1000} segundos…</div>
      )}

      <main className="layout">
        <section className="column-chat">
          <Chat
            messages={messages}
            sending={sending}
            blockedFor={blockedFor}
            quotaExhausted={quotaExhausted}
            status={status}
            onSend={sendPrompt}
            onUpgrade={() => openUpgrade('quota')}
          />
        </section>

        <aside className="column-side">
          <TokenQuotaCard status={status} resetIn={monthlyResetIn} onUpgrade={() => openUpgrade()} />
          <RateLimitCard status={status} resetIn={rateResetIn} blockedFor={blockedFor} />
          <UsageChart history={history} />
        </aside>
      </main>

      <footer className="footer">
        Plataforma de consumo de IA simulada · Patrón Proxy: RateLimitProxyService → QuotaProxyService → MockAIGenerationService
      </footer>

      {upgradeOpen && status && (
        <UpgradeModal
          userId={userId}
          currentPlan={status.plan}
          reason={upgradeReason}
          onClose={closeUpgrade}
          onUpgraded={handleUpgraded}
        />
      )}

      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
