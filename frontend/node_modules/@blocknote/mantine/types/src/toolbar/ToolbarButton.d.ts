export declare const TooltipContent: (props: {
    mainTooltip: string;
    secondaryTooltip?: string;
}) => import("react/jsx-runtime").JSX.Element;
/**
 * Helper for basic buttons that show in the formatting toolbar.
 */
export declare const ToolbarButton: import("react").ForwardRefExoticComponent<({
    className?: string;
    mainTooltip?: string;
    secondaryTooltip?: string;
    icon?: import("react").ReactNode;
    onClick?: (e: import("react").MouseEvent) => void;
    isSelected?: boolean;
    isDisabled?: boolean;
    variant?: "default" | "compact";
} & ({
    children: import("react").ReactNode;
    label?: string;
} | {
    children?: undefined;
    label: string;
})) & import("react").RefAttributes<HTMLButtonElement>>;
