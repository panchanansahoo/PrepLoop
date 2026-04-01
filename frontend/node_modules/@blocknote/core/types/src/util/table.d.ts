import type { InlineContentSchema, StyleSchema, PartialInlineContent } from "../schema";
import { PartialTableCell, TableCell } from "../schema/blocks/types.js";
/**
 * This will map a table cell to a TableCell object.
 * This is useful for when we want to get the full table cell object from a partial table cell.
 * It is guaranteed to return a new TableCell object.
 */
export declare function mapTableCell<T extends InlineContentSchema, S extends StyleSchema>(content: PartialInlineContent<T, S> | PartialTableCell<T, S> | TableCell<T, S>): TableCell<T, S>;
export declare function isPartialTableCell<T extends InlineContentSchema, S extends StyleSchema>(content: TableCell<T, S> | PartialInlineContent<T, S> | PartialTableCell<T, S> | undefined | null): content is PartialTableCell<T, S>;
export declare function isTableCell<T extends InlineContentSchema, S extends StyleSchema>(content: TableCell<T, S> | PartialInlineContent<T, S> | PartialTableCell<T, S> | undefined | null): content is TableCell<T, S>;
export declare function getColspan(cell: TableCell<any, any> | PartialTableCell<any, any> | PartialInlineContent<any, any>): number;
export declare function getRowspan(cell: TableCell<any, any> | PartialTableCell<any, any> | PartialInlineContent<any, any>): number;
