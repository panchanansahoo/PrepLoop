declare function useTableHandlePosition(orientation: "row" | "col" | "cell", show: boolean, referencePosCell: DOMRect | null, referencePosTable: DOMRect | null, draggingState?: {
    draggedCellOrientation: "row" | "col";
    mousePos: number;
}): {
    isMounted: boolean;
    ref: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
};
export declare function useTableHandlesPositioning(show: boolean, referencePosCell: DOMRect | null, referencePosTable: DOMRect | null, draggingState?: {
    draggedCellOrientation: "row" | "col";
    mousePos: number;
}): {
    rowHandle: ReturnType<typeof useTableHandlePosition>;
    colHandle: ReturnType<typeof useTableHandlePosition>;
    cellHandle: ReturnType<typeof useTableHandlePosition>;
};
export {};
