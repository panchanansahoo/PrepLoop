export declare const Badge: import("react").ForwardRefExoticComponent<{
    className?: string;
    text: string;
    icon?: import("react").ReactNode;
    isSelected?: boolean;
    mainTooltip?: string;
    secondaryTooltip?: string;
    onClick?: (event: React.MouseEvent) => void;
    onMouseEnter?: () => void;
} & import("react").RefAttributes<HTMLInputElement>>;
export declare const BadgeGroup: import("react").ForwardRefExoticComponent<{
    className?: string;
    children: import("react").ReactNode;
} & import("react").RefAttributes<HTMLDivElement>>;
