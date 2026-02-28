import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'default',
  padding = 20,
  style,
  onClick,
}: CardProps) {
  const baseStyle: React.CSSProperties = {
    borderRadius: 16,
    padding,
    border: '1px solid #252530',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : undefined,
  };

  const variants: Record<string, React.CSSProperties> = {
    default: { background: '#18181F' },
    elevated: { background: '#121218', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' },
    glass: {
      background: 'rgba(24, 24, 31, 0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    },
  };

  return (
    <div
      onClick={onClick}
      style={{ ...baseStyle, ...variants[variant], ...style }}
    >
      {children}
    </div>
  );
}
