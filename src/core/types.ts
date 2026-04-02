export interface Worktree {
  path: string;
  branch: string | null;
  head: string;
  isMain: boolean;
  isDirty: boolean;
  isLocked: boolean;
  lockReason?: string;
  repoName: string;
  repoPath: string;
}

export interface GitError extends Error {
  exitCode: number;
  stderr: string;
  command: string;
}

export class GitError extends Error {
  constructor(
    message: string,
    public exitCode: number,
    public stderr: string,
    public command: string,
  ) {
    super(message);
    this.name = "GitError";
  }
}

export class GitVersionError extends Error {
  constructor(public installed: string, public required: string) {
    super(`git version ${installed} is below minimum required ${required}`);
    this.name = "GitVersionError";
  }
}

export interface PinMetadata {
  branch: string;
  pinnedAt: string;
  reason?: string;
}

export type ActivityEventType =
  | "create"
  | "delete"
  | "switch"
  | "rename"
  | "archive"
  | "import";

export interface ActivityEvent {
  timestamp: string;
  event: ActivityEventType;
  branch: string;
  path?: string;
  details?: Record<string, string>;
}

export interface ArchiveEntry {
  branch: string;
  repo: string;
  archivedAt: string;
  patchPath: string;
  commitHash: string;
  message: string;
}

export class ArchiveError extends Error {
  constructor(
    message: string,
    public branch: string,
    public reason: string,
  ) {
    super(message);
    this.name = "ArchiveError";
  }
}

export class ImportError extends Error {
  constructor(
    message: string,
    public path: string,
    public reason: string,
  ) {
    super(message);
    this.name = "ImportError";
  }
}
