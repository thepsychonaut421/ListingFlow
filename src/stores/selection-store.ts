import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SelectionState = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  setMany: (ids: string[], checked: boolean) => void;
  clear: () => void;
};

// Based on the user's suggestion to ensure immutability.
export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      selectedIds: new Set<string>(),
      toggle: (id) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds); // <<< Ensure immutability
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          return { selectedIds: newSelectedIds };
        }),
      setMany: (ids, checked) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds); // <<< Ensure immutability
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
        // Custom reviver/replacer to handle Set serialization.
        reviver: (key, value) => {
          if (key === 'selectedIds' && Array.isArray(value)) {
            return new Set(value);
          }
          return value;
        },
        replacer: (key, value) => {
          if (key === 'selectedIds' && value instanceof Set) {
            return Array.from(value);
          }
          return value;
        },
      }),
    }
  )
);
