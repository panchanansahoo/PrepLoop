declare function useExtendButtonPosition(orientation: "addOrRemoveRows" | "addOrRemoveColumns", show: boolean, referencePosTable: DOMRect | null): {
    isMounted: boolean;
    ref: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
};
export declare function useExtendButtonsPositioning(showAddOrRemoveColumnsButton: boolean, showAddOrRemoveRowsButton: boolean, referencePosTable: DOMRect | null): {
    addOrRemoveRowsButton: ReturnType<typeof useExtendButtonPosition>;
    addOrRemoveColumnsButton: ReturnType<typeof useExtendButtonPosition>;
};
export {};
