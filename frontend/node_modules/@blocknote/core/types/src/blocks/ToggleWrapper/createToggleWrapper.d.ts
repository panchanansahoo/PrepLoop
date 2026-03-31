import { ViewMutationRecord } from "@tiptap/pm/view";
import { BlockNoteEditor } from "../../editor/BlockNoteEditor.js";
import { Block } from "../defaultBlocks.js";
type ToggledState = {
    set: (block: Block<any, any, any>, isToggled: boolean) => void;
    get: (block: Block<any, any, any>) => boolean;
};
export declare const defaultToggledState: ToggledState;
export declare const createToggleWrapper: (block: Block<any, any, any>, editor: BlockNoteEditor<any, any, any>, renderedElement: HTMLElement, toggledState?: ToggledState) => {
    dom: HTMLElement;
    contentDOM?: HTMLElement;
    ignoreMutation?: (mutation: ViewMutationRecord) => boolean;
    destroy?: () => void;
};
export {};
