import { createContext, createSignal, useContext, type JSX } from "solid-js";

export type TabId = "list" | "add" | "config" | "doctor";

interface AppState {
  activeTab: () => TabId;
  setActiveTab: (tab: TabId) => void;
  selectedWorktreeIndex: () => number;
  setSelectedWorktreeIndex: (idx: number) => void;
  showRemove: () => boolean;
  setShowRemove: (v: boolean) => void;
  showCommandPalette: () => boolean;
  setShowCommandPalette: (v: boolean) => void;
  showDetailView: () => boolean;
  setShowDetailView: (v: boolean) => void;
  repoPath: () => string;
  repoPaths: () => string[];
  selectedWorktrees: () => Set<number>;
  toggleWorktreeSelection: (idx: number) => void;
  selectAllNonMain: (worktreeCount: number, isMainAt: (idx: number) => boolean) => void;
  clearSelection: () => void;
  showBulkActions: () => boolean;
  setShowBulkActions: (v: boolean) => void;
}

const AppContext = createContext<AppState>();

export function AppProvider(props: {
  children: JSX.Element;
  repoPath: string;
  repoPaths: string[];
}) {
  const [activeTab, setActiveTab] = createSignal<TabId>("list");
  const [selectedWorktreeIndex, setSelectedWorktreeIndex] = createSignal(0);
  const [showRemove, setShowRemove] = createSignal(false);
  const [showCommandPalette, setShowCommandPalette] = createSignal(false);
  const [showDetailView, setShowDetailView] = createSignal(false);
  const [selectedWorktrees, setSelectedWorktrees] = createSignal<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = createSignal(false);

  const toggleWorktreeSelection = (idx: number) => {
    const next = new Set(selectedWorktrees());
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedWorktrees(next);
  };

  const selectAllNonMain = (worktreeCount: number, isMainAt: (idx: number) => boolean) => {
    const next = new Set<number>();
    for (let i = 0; i < worktreeCount; i++) {
      if (!isMainAt(i)) next.add(i);
    }
    setSelectedWorktrees(next);
  };

  const clearSelection = () => {
    setSelectedWorktrees(new Set<number>());
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedWorktreeIndex,
        setSelectedWorktreeIndex,
        showRemove,
        setShowRemove,
        showCommandPalette,
        setShowCommandPalette,
        showDetailView,
        setShowDetailView,
        repoPath: () => props.repoPath,
        repoPaths: () => props.repoPaths,
        selectedWorktrees,
        toggleWorktreeSelection,
        selectAllNonMain,
        clearSelection,
        showBulkActions,
        setShowBulkActions,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
