
'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Sparkles, Loader2, Edit, Trash2, Search, Copy, PackageSearch, Send, ImageIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { handleExternalSearch } from '@/lib/external-search';
import { findEbayCategoryId } from '@/ai/flows/find-ebay-category-id';
import { useToast } from '@/hooks/use-toast';

type GetColumnsProps = {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onGenerate: (product: Product) => void;
  onCopyDescription: (product: Product, source: 'otto' | 'ebay') => void;
  onExtractTechSpecs: (product: Product) => void;
  onSendToEbay: (product: Product) => void;
  onPublishToShopify: (product: Product) => void;
  generatingProductId: string | null;
  onUpdateProduct: (id: string, data: Partial<Product>) => void;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}

const statusVariantMap: Record<Product['listingStatus'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    listed: 'default',
    draft: 'secondary',
    error: 'destructive',
    new: 'outline',
    used: 'outline',
    refurbished: 'outline',
    active: 'default',
    archived: 'secondary'
};

export const getColumns = ({ onEdit, onDelete, onGenerate, onCopyDescription, onExtractTechSpecs, onSendToEbay, onPublishToShopify, generatingProductId, onUpdateProduct }: GetColumnsProps): ColumnDef<Product>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
      const mainImage = product.images.find(img => img.isMain) || product.images[0];
      const imageUrl = mainImage?.url || 'https://placehold.co/40x40.png';
      return (
        <div className="flex items-center gap-4">
          <img
            src={imageUrl}
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
    accessorKey: 'ebayCategoryId',
    header: 'eBay Category',
    cell: ({ row }) => {
      const product = row.original;
      const categoryId = row.getValue('ebayCategoryId') as string;
      const { toast } = useToast();

      const handleDetect = async () => {
         const productName = product.name?.trim();
         if (!productName) {
            toast({
                variant: 'destructive',
                title: 'Detection Failed',
                description: 'Product name is required to find a category.',
            });
            return;
         }

        try {
            const result = await findEbayCategoryId({ productTitle: productName, ean: product.ean });

            if (result.categoryId) {
                onUpdateProduct(product.id, { ebayCategoryId: result.categoryId });
                toast({
                    title: 'Category Detected!',
                    description: `Suggested category: ${result.categoryPath} (${result.categoryId})`,
                });
            } else {
                 throw new Error('No match found');
            }
        } catch(e: any) {
            toast({
                variant: 'destructive',
                title: 'Detection Failed',
                description: e.message || 'Could not find a matching category in the local knowledge base.',
            });
        }
      };
      
      const handlePick = () => onEdit(product); // Opens the edit form

      return (
        <div className="flex items-center gap-2">
          {categoryId ? (
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md">{categoryId}</span>
          ) : (
             <span className="text-muted-foreground text-xs italic">Not set</span>
          )}
          <EbayCategoryButton 
            onDetect={handleDetect} 
            onPick={handlePick} 
            lastUsed={categoryId}
            canDetect={!!product.name?.trim()}
          />
        </div>
      );
    }
  },
  {
    accessorKey: 'listingStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('listingStatus') as Product['listingStatus'];
      const variant = statusVariantMap[status] || 'outline';
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
                    <span>Working...</span>
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
                     <DropdownMenuLabel>Publish</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onSendToEbay(product)}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Send to eBay Drafts</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => onPublishToShopify(product)}>
                        <Send className="mr-2 h-4 w-4" />
                        <span>Publish to Shopify</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>AI Tools</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onGenerate(product)}>
                            <Sparkles className="mr-2 h-4 w-4 text-primary" />
                            <span>Auto-fill with AI</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onExtractTechSpecs(product)}>
                            <PackageSearch className="mr-2 h-4 w-4" />
                            <span>Extract Tech Specs</span>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Copy className="mr-2 h-4 w-4" />
                                <span>Copy Description</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => onCopyDescription(product, 'otto')}>
                                    <span>From OTTO.de</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onCopyDescription(product, 'ebay')}>
                                    <span>From eBay.de</span>
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                     <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Search className="mr-2 h-4 w-4" />
                            <span>External Search</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                           <DropdownMenuSubContent>
                             <DropdownMenuItem onClick={() => handleExternalSearch(product, 'google')}>
                                <Search className="mr-2 h-4 w-4" />
                                <span>Search on Google</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExternalSearch(product, 'ebay')}>
                                <Search className="mr-2 h-4 w-4" />
                                <span>Search on eBay.de</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExternalSearch(product, 'amazon')}>
                                <Search className="mr-2 h-4 w-4" />
                                <span>Search on Amazon.de</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleExternalSearch(product, 'otto')}>
                                <Search className="mr-2 h-4 w-4" />
                                <span>Search on OTTO.de</span>
                            </DropdownMenuItem>
                           </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                     </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      );
    },
  },
];


function EbayCategoryButton({ onDetect, onPick, lastUsed, canDetect }: { onDetect: () => void; onPick: () => void; lastUsed?: string, canDetect: boolean }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDetectClick = async () => {
    setIsLoading(true);
    try {
      await onDetect();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="inline-flex items-stretch rounded-md shadow-sm">
      <Button 
        type="button" 
        onClick={handleDetectClick} 
        size="sm" 
        className="rounded-r-none h-8" 
        disabled={isLoading || !canDetect}
        title={!canDetect ? 'Product name is required' : 'Detect eBay Category'}
       >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-l-none border-l-0 h-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {lastUsed && <DropdownMenuItem disabled>Last used: {lastUsed}</DropdownMenuItem>}
          <DropdownMenuItem onClick={onPick}>
            Choose manually…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
