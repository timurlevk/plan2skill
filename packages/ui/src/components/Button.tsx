import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #9D7AFF 0%, #4ECDC4 100%)',
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: '#FFFFFF',
    border: '1px solid #252530',
  },
  ghost: {
    background: 'transparent',
    color: '#A1A1AA',
    border: 'none',
  },
  danger: {
    background: '#FF6B8A',
    color: '#FFFFFF',
    border: 'none',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 13 },
  md: { padding: '12px 20px', fontSize: 14 },
  lg: { padding: '16px 28px', fontSize: 15 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className,
  style,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        fontWeight: 600,
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        outline: 'none',
        ...style,
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}
