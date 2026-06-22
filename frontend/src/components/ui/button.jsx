import React from 'react';

const variantStyles = {
    default: {
        background: 'var(--accent-primary, #ffffff)',
        color: 'var(--text-invert, #000000)',
        border: 'none',
    },
    outline: {
        background: 'transparent',
        color: 'var(--text-primary, #fff)',
        border: '1px solid var(--border, rgba(255,255,255,0.2))',
    },
    ghost: {
        background: 'transparent',
        color: 'var(--text-primary, #fff)',
        border: 'none',
    },
    destructive: {
        background: '#dc2626',
        color: '#fff',
        border: 'none',
    },
    secondary: {
        background: 'var(--accent-glow, rgba(255,255,255,0.08))',
        color: 'var(--text-primary, #fff)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
    },
    link: {
        background: 'transparent',
        color: 'var(--text-secondary, #d4d4d8)',
        border: 'none',
        textDecoration: 'underline',
    },
};

const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '13px', borderRadius: '8px' },
    default: { padding: '10px 20px', fontSize: '14px', borderRadius: '10px' },
    lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '12px' },
    icon: { padding: '10px', fontSize: '14px', borderRadius: '10px', lineHeight: 1 },
};

export const Button = React.forwardRef(function Button(
    {
        children,
        variant = 'default',
        size = 'default',
        asChild = false,
        className = '',
        style = {},
        ...props
    },
    ref
) {
    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'opacity 0.15s, transform 0.1s',
        textDecoration: 'none',
        outline: 'none',
        userSelect: 'none',
        ...variantStyles[variant] ?? variantStyles.default,
        ...sizeStyles[size] ?? sizeStyles.default,
        ...style,
    };

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            ...props,
            ref,
            style: { ...baseStyle, ...children.props.style },
            className: `${children.props.className ?? ''} ${className}`.trim(),
        });
    }

    return (
        <button ref={ref} style={baseStyle} className={className} {...props}>
            {children}
        </button>
    );
});

export default Button;