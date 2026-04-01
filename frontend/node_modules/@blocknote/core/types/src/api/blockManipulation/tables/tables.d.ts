import { DefaultBlockSchema } from "../../../blocks/defaultBlocks.js";
import { BlockFromConfigNoChildren, TableCell, TableContent } from "../../../schema/blocks/types.js";
/**
 * Here be dragons.
 *
 * Tables are complex because of rowspan and colspan behavior.
 * The majority of this file is concerned with translating between "relative" and "absolute" indices.
 *
 * The following diagram may help explain the relationship between the different indices:
 *
 *  One-based indexing of rows and columns in a table:
 *  | 1-1 | 1-2 | 1-3 |
 *  | 2-1 | 2-2 | 2-3 |
 *  | 3-1 | 3-2 | 3-3 |
 *
 *  A complicated table with colspans and rowspans:
 *  | 1-1 | 1-2 | 1-2 |
 *  | 2-1 | 2-1 | 2-2 |
 *  | 2-1 | 2-1 | 3-1 |
 *
 * You can see here that we have:
 *  - two cells that contain the value "1-2", because it has a colspan of 2.
 *  - four cells that contain the value "2-1", because it has a rowspan of 2 and a colspan of 2.
 *
 * This would be represented in block note json (roughly) as:
 *  [
 *      {
 *       "cells": [
 *         {
 *           "type": "tableCell",
 *             "content": ["1,1"],
 *             "props": {
 *               "colspan": 1,
 *               "rowspan": 1
 *             },
 *           },
 *           {
 *             "type": "tableCell",
 *             "content": ["1,2"],
 *             "props": {
 *               "colspan": 2,
 *               "rowspan": 1
 *             }
 *           }
 *         ],
 *       },
 *       {
 *         "cells": [
 *           {
 *             "type": "tableCell",
 *             "content": ["2,1"],
 *             "props": {
 *                 "colspan": 2,
 *                 "rowspan": 2
 *               }
 *             },
 *           {
 *             "type": "tableCell",
 *             "content": ["2,2"],
 *             "props": {
 *               "colspan": 1,
 *               "rowspan": 1
 *            }
 *         ],
 *       },
 *       {
 *         "cells": [
 *           {
 *             "type": "tableCell",
 *             "content": ["3,1"],
 *             "props": {
 *               "colspan": 1,
 *               "rowspan": 1,
 *             }
 *           }
 *         ]
 *       }
 *     ]
 *
 * Which maps cleanly to the following HTML:
 *
 * <table>
 *   <tr>
 *     <td>1-1</td>
 *     <td colspan="2">1-2</td>
 *   </tr>
 *   <tr>
 *     <td rowspan="2" colspan="2">2-1</td>
 *     <td>2-2</td>
 *   </tr>
 *   <tr>
 *     <td>3-1</td>
 *   </tr>
 * </table>
 *
 * We have a problem though, from the block json, there is no way to tell that the cell "2-1" is the second cell in the second row.
 * To resolve this, we created the occupancy grid, which is a grid of all the cells in the table, as though they were only 1x1 cells.
 * See {@link OccupancyGrid} for more information.
 *
 */
/**
 * Relative cell indices are relative to the table block's content.
 *
 * This is a sparse representation of the table and is how HTML and BlockNote JSON represent tables.
 *
 * For example, if we have a table with a rowspan of 2, the second row may only have 1 element in a 2x2 table.
 *
 * ```
 * // Visual representation of the table
 *     | 1-1 | 1-2 | // has 2 cells
 *     | 1-1 | 2-2 | // has only 1 cell
 * // Relative cell indices
 *     [{ row: 1, col: 1, rowspan: 2 }, { row: 1, col: 2 }] // has 2 cells
 *     [{ row: 1, col: 2 }] // has only 1 cell
 * ```
 */
export type RelativeCellIndices = {
    row: number;
    col: number;
};
/**
 * Absolute cell indices are relative to the table's layout (it's {@link OccupancyGrid}).
 *
 * It is as though the table is a grid of 1x1 cells, and any colspan or rowspan results in multiple 1x1 cells being occupied.
 *
 * For example, if we have a table with a colspan of 2, it will occupy 2 cells in the layout grid.
 *
 * ```
 * // Visual representation of the table
 *     | 1-1 | 1-1 | // has 2 cells
 *     | 2-1 | 2-2 | // has 2 cell
 * // Absolute cell indices
 *     [{ row: 1, col: 1, colspan: 2 }, { row: 1, col: 2, colspan: 2 }] // has 2 cells
 *     [{ row: 1, col: 1 }, { row: 1, col: 2 }] // has 2 cells
 * ```
 */
export type AbsoluteCellIndices = {
    row: number;
    col: number;
};
/**
 * An occupancy grid is a grid of the occupied cells in the table.
 * It is used to track the occupied cells in the table to know where to place the next cell.
 *
 * Since it allows us to resolve cell indices both {@link RelativeCellIndices} and {@link AbsoluteCellIndices}, it is the core data structure for table operations.
 */
type OccupancyGrid = (RelativeCellIndices & {
    /**
     * The rowspan of the cell.
     */
    rowspan: number;
    /**
     * The colspan of the cell.
     */
    colspan: number;
    /**
     * The cell.
     */
    cell: TableCell<any, any>;
})[][];
/**
 * This will return the {@link OccupancyGrid} of the table.
 * By laying out the table as though it were a grid of 1x1 cells, we can easily track where the cells are located (both relatively and absolutely).
 *
 * @returns an {@link OccupancyGrid}
 */
export declare function getTableCellOccupancyGrid(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>): OccupancyGrid;
/**
 * Given an {@link OccupancyGrid}, this will return the {@link TableContent} rows.
 *
 * @note This will remove duplicates from the occupancy grid. And does no bounds checking for validity of the occupancy grid.
 */
export declare function getTableRowsFromOccupancyGrid(occupancyGrid: OccupancyGrid): TableContent<any, any>["rows"];
/**
 * This will resolve the relative cell indices within the table block to the absolute cell indices within the table, accounting for colspan and rowspan.
 *
 * @note It will return only the first cell (i.e. top-left) that matches the relative cell indices. To find the other absolute cell indices this cell occupies, you can assume it is the rowspan and colspan number of cells away from the top-left cell.
 *
 * @returns The {@link AbsoluteCellIndices} and the {@link TableCell} at the absolute position.
 */
export declare function getAbsoluteTableCells(
/**
 * The relative position of the cell in the table.
 */
relativeCellIndices: RelativeCellIndices, 
/**
 * The table block containing the cell.
 */
block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, 
/**
 * The occupancy grid of the table.
 */
occupancyGrid?: OccupancyGrid): AbsoluteCellIndices & {
    cell: TableCell<any, any>;
};
/**
 * This will get the dimensions of the table block.
 *
 * @returns The height and width of the table.
 */
export declare function getDimensionsOfTable(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>): {
    /**
     * The number of rows in the table.
     */
    height: number;
    /**
     * The number of columns in the table.
     */
    width: number;
};
/**
 * This will resolve the absolute cell indices within the table block to the relative cell indices within the table, accounting for colspan and rowspan.
 *
 * @returns The {@link RelativeCellIndices} and the {@link TableCell} at the relative position.
 */
export declare function getRelativeTableCells(
/**
 * The {@link AbsoluteCellIndices} of the cell in the table.
 */
absoluteCellIndices: AbsoluteCellIndices, 
/**
 * The table block containing the cell.
 */
block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, 
/**
 * The occupancy grid of the table.
 */
occupancyGrid?: OccupancyGrid): (RelativeCellIndices & {
    cell: TableContent<any, any>["rows"][number]["cells"][number];
}) | undefined;
/**
 * This will get all the cells within a relative row of a table block.
 *
 * This method always starts the search for the row at the first column of the table.
 *
 * ```
 * // Visual representation of a table
 * | A | B | C |
 * |   | D | E |
 * | F | G | H |
 * // "A" has a rowspan of 2
 *
 * // getCellsAtRowHandle(0)
 * // returns [
 *  { row: 0, col: 0, cell: "A" },
 *  { row: 0, col: 1, cell: "B" },
 *  { row: 0, col: 2, cell: "C" },
 * ]
 *
 * // getCellsAtColumnHandle(1)
 * // returns [
 *  { row: 1, col: 0, cell: "F" },
 *  { row: 1, col: 1, cell: "G" },
 *  { row: 1, col: 2, cell: "H" },
 * ]
 * ```
 *
 * As you can see, you may not be able to retrieve all nodes given a relative row index, as cells can span multiple rows.
 *
 * @returns All of the cells associated with the relative row of the table. (All cells that have the same relative row index)
 */
export declare function getCellsAtRowHandle(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, relativeRowIndex: RelativeCellIndices["row"]): (RelativeCellIndices & {
    cell: TableCell<any, any>;
})[];
/**
 * This will get all the cells within a relative column of a table block.
 *
 * This method always starts the search for the column at the first row of the table.
 *
 * ```
 * // Visual representation of a table
 * |   A   | B |
 * | C | D | E |
 * | F | G | H |
 * // "A" has a colspan of 2
 *
 * // getCellsAtColumnHandle(0)
 * // returns [
 *  { row: 0, col: 0, cell: "A" },
 *  { row: 1, col: 0, cell: "C" },
 *  { row: 2, col: 0, cell: "F" },
 * ]
 *
 * // getCellsAtColumnHandle(1)
 * // returns [
 *  { row: 0, col: 1, cell: "B" },
 *  { row: 1, col: 2, cell: "E" },
 *  { row: 2, col: 2, cell: "F" },
 * ]
 * ```
 *
 * As you can see, you may not be able to retrieve all nodes given a relative column index, as cells can span multiple columns.
 *
 * @returns All of the cells associated with the relative column of the table. (All cells that have the same relative column index)
 */
export declare function getCellsAtColumnHandle(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, relativeColumnIndex: RelativeCellIndices["col"]): (RelativeCellIndices & {
    cell: TableCell<any, any>;
})[];
/**
 * This moves a column from one index to another.
 *
 * @note This is a destructive operation, it will modify the provided {@link OccupancyGrid} in place.
 */
export declare function moveColumn(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, fromColIndex: RelativeCellIndices["col"], toColIndex: RelativeCellIndices["col"], occupancyGrid?: OccupancyGrid): TableContent<any, any>["rows"];
/**
 * This moves a row from one index to another.
 *
 * @note This is a destructive operation, it will modify the {@link OccupancyGrid} in place.
 */
export declare function moveRow(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, fromRowIndex: RelativeCellIndices["row"], toRowIndex: RelativeCellIndices["row"], occupancyGrid?: OccupancyGrid): TableContent<any, any>["rows"];
/**
 * This will remove empty rows or columns from the table.
 *
 * @note This is a destructive operation, it will modify the {@link OccupancyGrid} in place.
 */
export declare function cropEmptyRowsOrColumns(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, removeEmpty: "columns" | "rows", occupancyGrid?: OccupancyGrid): TableContent<any, any>["rows"];
/**
 * This will add a specified number of rows or columns to the table (filling with empty cells).
 *
 * @note This is a destructive operation, it will modify the {@link OccupancyGrid} in place.
 */
export declare function addRowsOrColumns(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, addType: "columns" | "rows", 
/**
 * The number of rows or columns to add.
 *
 * @note if negative, it will remove rows or columns.
 */
numToAdd: number, occupancyGrid?: OccupancyGrid): TableContent<any, any>["rows"];
/**
 * Checks if a row can be safely dropped at the target row index without splitting merged cells.
 */
export declare function canRowBeDraggedInto(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, draggingIndex: RelativeCellIndices["row"], targetRowIndex: RelativeCellIndices["row"]): boolean;
/**
 * Checks if a column can be safely dropped at the target column index without splitting merged cells.
 */
export declare function canColumnBeDraggedInto(block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>, draggingIndex: RelativeCellIndices["col"], targetColumnIndex: RelativeCellIndices["col"]): boolean;
/**
 * Checks if two cells are in the same column.
 *
 * @returns True if the cells are in the same column, false otherwise.
 */
export declare function areInSameColumn(from: RelativeCellIndices, to: RelativeCellIndices, block: BlockFromConfigNoChildren<DefaultBlockSchema["table"], any, any>): boolean;
export {};
