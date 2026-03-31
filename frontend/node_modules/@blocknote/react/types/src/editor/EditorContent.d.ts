import { ReactRenderer } from "@tiptap/react";
export declare function getContentComponent(): {
    /**
     * Subscribe to the editor instance's changes.
     */
    subscribe(callback: () => void): () => void;
    getSnapshot(): Record<string, import("react").ReactPortal>;
    getServerSnapshot(): Record<string, import("react").ReactPortal>;
    /**
     * Adds a new NodeView Renderer to the editor.
     */
    setRenderer(id: string, renderer: ReactRenderer): void;
    /**
     * Removes a NodeView Renderer from the editor.
     */
    removeRenderer(id: string): void;
};
type ContentComponent = ReturnType<typeof getContentComponent>;
/**
 * This component renders all of the editor's node views.
 */
export declare const Portals: React.FC<{
    contentComponent: ContentComponent;
}>;
export {};
