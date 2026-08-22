import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-[#234b37] bg-[#234b37] text-white hover:bg-[#193c2b]',
  secondary: 'border-[#c3c7be] bg-white text-[#30352f] hover:bg-[#f4f5f1]',
  danger: 'border-[#a3463f] bg-[#a3463f] text-white hover:bg-[#873832]',
  ghost: 'border-transparent bg-transparent text-[#4f5a51] hover:bg-[#eceee9]',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] border px-4 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

