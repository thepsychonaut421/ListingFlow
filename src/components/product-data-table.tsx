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
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      const idsToUpdate = Object.keys(newSelection);
      const toSelect: string[] = [];
      const toDeselect: string[] = [];

      // Logic to handle "select all" which gives a full object
      if (Object.keys(newSelection).length > table.getRowModel().rows.length / 2) {
         table.getRowModel().rows.forEach(row => {
            if (newSelection[row.id] && !selectedIds.has(row.id)) {
              toSelect.push(row.id);
            } else if (!newSelection[row.id] && selectedIds.has(row.id)) {
              toDeselect.push(row.id);
            }
         });
      } else { // Logic to handle individual clicks which give sparse objects
         idsToUpdate.forEach(id => {
            if (newSelection[id]) {
                toSelect.push(id);
            } else {
                toDeselect.push(id);
            }
         });
      }

      if (toSelect.length) setMany(toSelect, true);
      if (toDeselect.length) setMany(toDeselect, false);
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
