import type { Block } from "@blocknote/core";

/**
 * This attributes the changes to a specific source.
 */
type BlockChangeSource = {
  /**
   * The type of change source:
   * - "local": Triggered by local user (default)
   * - "paste": From paste operation
   * - "drop": From drop operation
   * - "undo"/"redo"/"undo-redo": From undo/redo operations
   * - "yjs-remote": From remote user
   */
  type:
    | "local"
    | "paste"
    | "drop"
    | "undo"
    | "redo"
    | "undo-redo"
    | "yjs-remote";
};

export type BlocksChanged = Array<
  | {
      // The affected block
      block: Block;
      // The source of the change
      source: BlockChangeSource;
      type: "insert" | "delete";
      // Insert and delete changes don't have a previous block
      prevBlock: undefined;
    }
  | {
      // The affected block
      block: Block;
      // The source of the change
      source: BlockChangeSource;
      type: "update";
      // The block before the update
      prevBlock: Block;
    }
>;
