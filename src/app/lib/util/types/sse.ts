export type SnapshotSSE = {
  type: "new-snapshot-ready" | "connected";
  snapshotId: string;
  projectId: string;
  repoUrl: string;
  timestamp: string;
};
