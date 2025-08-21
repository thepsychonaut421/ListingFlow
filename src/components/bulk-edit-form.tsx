'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { Product } from '@/lib/types';
import { CategoryCombobox } from './category-combobox';


const bulkEditSchema = z.object({
  listingStatus: z.enum(['', 'draft', 'listed', 'error', 'new', 'used', 'refurbished', 'active', 'archived']).optional(),
  category: z.string().optional(),
  ebayCategoryId: z.string().optional(),
});

type BulkEditFormValues = z.infer<typeof bulkEditSchema>;

interface BulkEditFormProps {
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export function BulkEditForm({ onSave, onCancel }: BulkEditFormProps) {
  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      listingStatus: '',
      category: '',
      ebayCategoryId: '',
    },
  });

  const onSubmit = (data: BulkEditFormValues) => {
    // Construct an update object only with fields that have values
    const updateData: Partial<Product> = {};
    if (data.listingStatus) {
      updateData.listingStatus = data.listingStatus as Product['listingStatus'];
    }
    if (data.category) {
      updateData.category = data.category;
    }
    if (data.ebayCategoryId) {
        updateData.ebayCategoryId = data.ebayCategoryId;
    }
    
    onSave(updateData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="listingStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Leave unchanged" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shopify Category</FormLabel>
                <CategoryCombobox 
                    value={field.value || ''}
                    onChange={field.onChange}
                />
                 <FormDescription>
                  This will apply to all selected products.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="ebayCategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>eBay Category ID</FormLabel>
                <FormControl>
                  <Input placeholder="Leave unchanged" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Apply Changes</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
