export declare const TableHandle: import("react").ForwardRefExoticComponent<({
    className?: string;
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    style?: import("react").CSSProperties;
} & ({
    children: import("react").ReactNode;
    label?: string;
} | {
    children?: undefined;
    label: string;
})) & import("react").RefAttributes<HTMLButtonElement>>;
