import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, hint, tone = 'primary', delay = 0 }) {
  return (
    <motion.div
      className={`stat-card tone-${tone}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -3 }}
    >
      {Icon && (
        <div className="stat-icon" aria-hidden="true">
          <Icon size={18} />
        </div>
      )}
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <motion.div
          key={String(value)}
          className="stat-value"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {value}
        </motion.div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </motion.div>
  );
}
