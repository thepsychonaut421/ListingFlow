'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { MoreHorizontal, ArrowUpDown, Sparkles, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

type GetColumnsProps = {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onGenerate: (product: Product) => void;
  generatingProductId: string | null;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export const getColumns = ({ onEdit, onDelete, onGenerate, generatingProductId }: GetColumnsProps): ColumnDef<Product>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-4">
          <Image
            src={product.image}
            alt={product.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
            data-ai-hint="product image"
          />
          <div className="font-medium">{product.name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'listingStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('listingStatus') as string;
      const variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = 
        status === 'listed' ? 'default' : 
        status === 'draft' ? 'secondary' :
        status === 'error' ? 'destructive' : 'outline';
      return <Badge variant={variant} className="capitalize">{status}</Badge>;
    },
  },
  {
    accessorKey: 'price',
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return <div className="text-right font-medium">{formatCurrency(price)}</div>;
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
  },
  {
    accessorKey: 'code',
    header: 'SKU',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;
      const isGenerating = generatingProductId === product.id;

      return (
        <div className="text-right">
            {isGenerating ? (
                <div className="flex justify-end items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                </div>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>AI Tools</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onGenerate(product)}>
                            <Sparkles className="mr-2 h-4 w-4 text-primary" />
                            <span>Generate Description</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      );
    },
  },
];
