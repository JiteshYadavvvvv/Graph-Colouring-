import { motion } from 'framer-motion';

/** Standard button. `variant`: primary | secondary | ghost | danger | debug. */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  type = 'button',
  disabled,
  ...props
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" />}
      {children && <span>{children}</span>}
    </motion.button>
  );
}
