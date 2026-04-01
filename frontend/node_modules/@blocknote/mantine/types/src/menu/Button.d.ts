export declare const Button: import("react").ForwardRefExoticComponent<({
    className?: string;
    onClick?: (e: import("react").MouseEvent) => void;
    icon?: import("react").ReactNode;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    draggable?: boolean;
} & ({
    children: import("react").ReactNode;
    label?: string;
} | {
    children?: undefined;
    label: string;
})) & import("react").RefAttributes<HTMLButtonElement>>;
