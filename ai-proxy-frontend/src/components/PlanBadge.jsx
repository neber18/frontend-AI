import { PLAN_LABELS } from '../utils/format.js';

export default function PlanBadge({ plan, size = 'md' }) {
  if (!plan) return <span className="badge badge-loading">…</span>;
  return <span className={`badge badge-${plan.toLowerCase()} badge-${size}`}>{PLAN_LABELS[plan] || plan}</span>;
}
