import type { BlockNoteEditor } from "../editor/BlockNoteEditor.js";
/**
 * This is used to keep track of positions of elements in the editor.
 * It is needed because y-prosemirror's sync plugin can disrupt normal prosemirror position mapping.
 *
 * It is specifically made to be able to be used whether the editor is being used in a collaboratively, or single user, providing the same API.
 *
 * @param editor The editor to track the position of.
 * @param position The position to track.
 * @param side The side of the position to track. "left" is the default. "right" would move with the change if the change is in the right direction.
 * @returns A function that returns the position of the element.
 */
export declare function trackPosition(
/**
 * The editor to track the position of.
 */
editor: BlockNoteEditor<any, any, any>, 
/**
 * The position to track.
 */
position: number, 
/**
 * This is the side of the position to track. "left" is the default. "right" would move with the change if the change is in the right direction.
 */
side?: "left" | "right"): () => number;
