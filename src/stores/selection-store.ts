import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SelectionState = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  setMany: (ids: string[], checked: boolean) => void;
  clear: () => void;
};

// Type guard for safer deserialization
type SetPayload = { dataType: 'Set'; value: unknown[] };

function isSetPayload(v: unknown): v is SetPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    'dataType' in v &&
    (v as any).dataType === 'Set' &&
    'value' in v &&
    Array.isArray((v as any).value)
  );
}


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
      name: 'listingflow-selection-v2', // Changed name to prevent conflicts with old structure
      storage: createJSONStorage(() => localStorage, {
        // Custom reviver/replacer to handle Set serialization.
        replacer: (key, value) => {
          if (value instanceof Set) {
            return {
              dataType: 'Set',
              value: Array.from(value),
            };
          }
          return value;
        },
        reviver: (key, value) => {
          if (isSetPayload(value)) {
            return new Set(value.value);
          }
          return value;
        },
      }),
    }
  )
);
