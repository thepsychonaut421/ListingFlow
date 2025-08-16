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

const bulkEditSchema = z.object({
  listingStatus: z.enum(['', 'draft', 'listed', 'error', 'new', 'used', 'refurbished']).optional(),
  category: z.string().optional(),
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
    },
  });

  const onSubmit = (data: BulkEditFormValues) => {
    const updateData: Partial<Product> = {};
    if (data.listingStatus) updateData.listingStatus = data.listingStatus as Product['listingStatus'];
    if (data.category) updateData.category = data.category;
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
                      <SelectValue placeholder="Leave blank to keep unchanged" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
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
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Leave blank to keep unchanged" {...field} />
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
