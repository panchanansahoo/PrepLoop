import { BlockNoteEditor } from "@blocknote/core";
/**
 * Returns the text for a thread (basically, the text where the mark is).
 *
 * Note / TODO: it might be nicer to store and use the original content
 * when the thread was created, instead of taking the actual content from the editor
 */
export declare function getReferenceText(editor: BlockNoteEditor<any, any, any>, threadPosition?: {
    from: number;
    to: number;
}): string;
/**
 * The ThreadsSidebar component can be used to display a list of comments in a sidebar.
 *
 * This component is similar to Google Docs "Show All Comments" sidebar (cmd+option+shift+A)
 */
export declare function ThreadsSidebar(props: {
    /**
     * Filter the comments in the sidebar. Can pass `"open"`, `"resolved"`, or
     * `"all"`, to only show open, resolved, or all comments.
     *
     * @default "all"
     */
    filter?: "open" | "resolved" | "all";
    /**
     * The maximum number of comments that can be in a thread before the replies
     * get collapsed.
     *
     * @default 5
     */
    maxCommentsBeforeCollapse?: number;
    /**
     * Sort the comments in the sidebar. Can pass `"position"`,
     * `"recent-activity"`, or `"oldest"`. Sorting by `"recent-activity"` uses the
     * most recently added comment to sort threads, while `"oldest"` uses the
     * thread creation date. Sorting by `"position"` puts comments in the same
     * order as their reference text in the editor.
     *
     * @default "position"
     */
    sort?: "position" | "recent-activity" | "oldest";
}): import("react/jsx-runtime").JSX.Element;
