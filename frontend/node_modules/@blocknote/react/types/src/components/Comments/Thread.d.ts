import { ThreadData } from "@blocknote/core/comments";
import { FocusEvent } from "react";
export type ThreadProps = {
    /**
     * The thread to display - you can use the `useThreads` hook to retrieve a
     * `Map` of all threads in the editor, mapped by their IDs.
     */
    thread: ThreadData;
    /**
     * A boolean flag for whether the thread is selected. Selected threads show an
     * editor for replies, and add a `selected` CSS class to the thread.
     */
    selected?: boolean;
    /**
     * The text in the editor that the thread refers to. See the
     * [`ThreadsSidebar`](https://github.com/TypeCellOS/BlockNote/tree/main/packages/react/src/components/Comments/ThreadsSidebar.tsx#L137)
     * component to find out how to get this.
     */
    referenceText?: string;
    /**
     * The maximum number of comments that can be in a thread before the replies
     * get collapsed.
     */
    maxCommentsBeforeCollapse?: number;
    /**
     * A function to call when the thread is focused.
     */
    onFocus?: (event: FocusEvent) => void;
    /**
     * A function to call when the thread is blurred.
     */
    onBlur?: (event: FocusEvent) => void;
    /**
     * The tab index for the thread.
     */
    tabIndex?: number;
};
/**
 * The Thread component displays a (main) comment with a list of replies (other comments).
 *
 * It also includes a composer to reply to the thread.
 */
export declare const Thread: ({ thread, selected, referenceText, maxCommentsBeforeCollapse, onFocus, onBlur, tabIndex, }: ThreadProps) => import("react/jsx-runtime").JSX.Element;
