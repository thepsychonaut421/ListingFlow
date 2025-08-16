import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SelectionState = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  setMany: (ids: string[], checked: boolean) => void;
  clear: () => void;
};

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      selectedIds: new Set<string>(),
      toggle: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          return { selectedIds: newSelectedIds };
        }),
      setMany: (ids, checked) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          ids.forEach((id) => {
            if (checked) {
              newSelectedIds.add(id);
            } else {
              newSelectedIds.delete(id);
            }
          });
          return { selectedIds: newSelectedIds };
        }),
      clear: () => set({ selectedIds: new Set() }),
    }),
    {
      name: 'listingflow-selection-v1',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key === 'selectedIds') {
            return new Set(value as string[]);
          }
          return value;
        },
        replacer: (key, value) => {
          if (key === 'selectedIds') {
            return Array.from(value as Set<string>);
          }
          return value;
        },
      }),
    }
  )
);
