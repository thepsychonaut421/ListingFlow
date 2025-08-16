'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useSelectionStore } from '@/stores/selection-store';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onBulkDelete: (selectedIds: string[]) => void;
}

export function ProductDataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  onBulkDelete,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Zustand store integration
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const setMany = useSelectionStore((state) => state.setMany);

  // Memoize row selection object from Zustand store
  const rowSelection: RowSelectionState = React.useMemo(() => {
    const selection: { [key: string]: boolean } = {};
    selectedIds.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedIds]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
        // This logic correctly handles individual and bulk selections
        // by diffing the incoming patch with the current state from the store.
        const currentSelection = rowSelection;
        const selectionPatch = typeof updater === 'function' ? updater(currentSelection) : updater;

        const idsToSelect: string[] = [];
        const idsToDeselect: string[] = [];

        for (const id in selectionPatch) {
            if (selectionPatch[id] && !currentSelection[id]) {
                idsToSelect.push(id);
            } else if (!selectionPatch[id] && currentSelection[id]) {
                idsToDeselect.push(id);
            }
        }
        
        // Handle "Select All" case where updater provides a complete object
        if (Object.keys(selectionPatch).length === data.length) {
             data.forEach(row => {
                if (selectionPatch[row.id] && !currentSelection[row.id]) {
                    if (!idsToSelect.includes(row.id)) idsToSelect.push(row.id);
                } else if (!selectionPatch[row.id] && currentSelection[row.id]) {
                    if (!idsToDeselect.includes(row.id)) idsToDeselect.push(row.id);
                }
             });
        }


        if (idsToSelect.length > 0) {
            setMany(idsToSelect, true);
        }
        if (idsToDeselect.length > 0) {
            setMany(idsToDeselect, false);
        }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleDeleteSelected = () => {
    const selectedIdsArray = Array.from(selectedIds);
    if(selectedIdsArray.length > 0) {
      onBulkDelete(selectedIdsArray);
    }
  }

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter products by name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         {table.getFilteredSelectedRowModel().rows.length > 0 && (
           <Button
            variant="destructive"
            size="sm"
            className="ml-auto gap-1"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4" />
            Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected on this page. Total selected: {selectedIds.size}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
