import React from 'react';

/* ─────────────────────────────────────────────────
   ConnectSphere UI kit — presentational components.
   Muted Charcoal SaaS design tokens.
   ───────────────────────────────────────────────── */

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  amber: 'btn-amber',
  success: 'btn-success',
  ghost: 'btn-ghost',
};

const SIZES = {
  lg: 'btn-lg',
  md: 'btn-md',
  sm: 'btn-sm',
  icon: 'btn-icon',
};

export const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`btn ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export function Card({ hover = false, className = '', children, ...props }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <p className="mt-1.5 text-xs text-secondary">{hint}</p>}
    </div>
  );
}

const BADGE_TONES = {
  neutral: 'border-white/10 text-secondary bg-white/[0.03]',
  success: 'border-[#7BAA82]/30 bg-[#7BAA82]/10 text-[#7BAA82]',
  warning: 'border-[#D9A441]/30 bg-[#D9A441]/10 text-[#D9A441]',
  danger: 'border-[#D66B6B]/30 bg-[#D66B6B]/10 text-[#D66B6B]',
  accent: 'border-[#A66BFF]/30 bg-[#A66BFF]/10 text-[#A66BFF]',
  rose: 'border-[#D97FA6]/30 bg-[#D97FA6]/10 text-[#D97FA6]',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[11px] font-medium tracking-wide ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function Avatar({ name = '', size = 'md', online, className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };
  const initial = (name || 'G').charAt(0).toUpperCase();
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        aria-hidden="true"
        className={`${sizes[size] || sizes.md} rounded-full bg-[#1F2530] border border-white/10 flex items-center justify-center font-semibold text-[#F4F5F7]`}
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#14181F] ${online ? 'bg-[#7BAA82]' : 'bg-[#9EA4AF]/40'}`}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-[3px]' };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-white/15 border-t-[#A66BFF] animate-spin ${sizes[size] || sizes.md} ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 bg-[#0D0F14]">
      <Logo className="opacity-75" iconOnly />
      <Spinner size="md" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`card p-10 text-center ${className}`}>
      {Icon && (
        <div className="w-10 h-10 rounded-xl border border-white/10 bg-[#161B23] flex items-center justify-center mx-auto mb-4">
          <Icon className="w-5 h-5 text-secondary" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {description && <p className="mt-1.5 text-xs text-secondary max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/* Brand logomark — Minimal orbital sphere ring matching Dusty Orchid & Soft Rose */
export function LogoMark({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="#14181F" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="18" cy="18" r="7" fill="url(#logoGrad)" />
      <ellipse
        cx="18"
        cy="18"
        rx="13"
        ry="5"
        stroke="#A66BFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform="rotate(-28 18 18)"
        opacity="0.85"
      />
      <circle cx="26" cy="12" r="2" fill="#D97FA6" />
      <defs>
        <linearGradient id="logoGrad" x1="11" y1="11" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A66BFF" />
          <stop offset="1" stopColor="#D97FA6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ iconOnly = false, showSubtitle = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className="w-8 h-8 flex-shrink-0" />
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold tracking-tight text-[#F4F5F7]">ConnectSphere</span>
          {showSubtitle && (
            <span className="text-[11px] font-normal text-secondary tracking-normal">realtime chat</span>
          )}
        </div>
      )}
    </span>
  );
}
