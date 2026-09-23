import { motion } from 'framer-motion';
import { LoaderCircle, RefreshCw, ServerCrash } from 'lucide-react';
import Button from './Button';

export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={28} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <motion.div
      className="state-box state-error"
      role="alert"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="state-icon">
        <ServerCrash size={26} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      <code className="state-hint">cd backend &amp;&amp; uvicorn main:app --reload</code>
      {onRetry && (
        <Button icon={RefreshCw} onClick={onRetry}>
          Retry connection
        </Button>
      )}
    </motion.div>
  );
}

export function EmptyState({ icon: Icon, title, message, children }) {
  return (
    <div className="state-box">
      {Icon && (
        <div className="state-icon muted">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {children}
    </div>
  );
}
