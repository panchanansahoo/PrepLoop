import { Fragment, Schema } from "prosemirror-model";
/**
 * This function is used to parse the content of a list item external HTML node.
 *
 * Due to a change in how prosemirror-model handles parsing elements, we have additional flexibility in how we can "fit" content into a list item.
 *
 * We've decided to take an approach that is similar to Notion. The core rules of the algorithm are:
 *
 *  - If the first child of an `li` has ONLY text content, take the text content, and flatten it into the list item. Subsequent siblings are carried over as is, as children of the list item.
 *    - e.g. `<li><h1>Hello</h1><p>World</p></li> -> <li>Hello<blockGroup><blockContainer><p>World</p></blockContainer></blockGroup></li>`
 *  - Else, take the content and insert it as children instead.
 *    - e.g. `<li><img src="url" /></li> -> <li><p></p><blockGroup><blockContainer><img src="url" /></blockContainer></blockGroup></li>`
 *
 * This ensures that a list item's content is always valid ProseMirror content. Smoothing over differences between how external HTML may be rendered, and how ProseMirror expects content to be structured.
 */
export declare function getListItemContent(
/**
 * The `li` element to parse.
 */
_node: Node, 
/**
 * The schema to use for parsing.
 */
schema: Schema, 
/**
 * The name of the list item node.
 */
name: string): Fragment;
