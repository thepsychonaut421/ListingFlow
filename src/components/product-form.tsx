'use client';

import * as React from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Trash2, PlusCircle } from 'lucide-react';
import { searchInERPNext } from '@/lib/erpnext';
import { HTMLPreview } from './html-preview';
import { CategoryCombobox } from './category-combobox';
import { findEbayCategoryId } from '@/ai/flows/find-ebay-category-id';


const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  code: z.string().min(1, 'SKU is required'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be a positive number'),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  description: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.string().optional(),
  ebayCategoryId: z.string().optional(),
  listingStatus: z.enum(['draft', 'listed', 'error', 'new', 'used', 'refurbished']),
  brand: z.string().optional(),
  productType: z.string().optional(),
  technicalSpecs: z.array(z.object({
    key: z.string().min(1, 'Key cannot be empty'),
    value: z.string().min(1, 'Value cannot be empty'),
  })),
  model: z.string().optional(),
  mpn: z.string().optional(),
  ean: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSave: (data: Product) => void;
  onCancel: () => void;
}


const toProductFormValues = (product: Product | null): ProductFormValues => {
    const technicalSpecs = product?.technicalSpecs 
        ? Object.entries(product.technicalSpecs).map(([key, value]) => ({ 
              key, 
              value: Array.isArray(value) ? value.join(', ') : String(value) 
          }))
        : [];

    return {
        name: product?.name || '',
        code: product?.code || '',
        quantity: product?.quantity || 0,
        price: product?.price || 0,
        description: product?.description || '',
        image: product?.image || '',
        category: product?.category || '',
        ebayCategoryId: product?.ebayCategoryId || '',
        listingStatus: product?.listingStatus || 'draft',
        brand: product?.brand || '',
        productType: product?.productType || '',
        ean: product?.ean || '',
        technicalSpecs: technicalSpecs,
        model: product?.model || '',
        mpn: product?.mpn || '',
        color: product?.color || '',
        material: product?.material || '',
        size: product?.size || '',
        dimensions: product?.dimensions || '',
        weight: product?.weight || '',
    };
};


export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [isFindingCategory, setIsFindingCategory] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toProductFormValues(product),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "technicalSpecs",
  });
  
  React.useEffect(() => {
    form.reset(toProductFormValues(product));
  }, [product, form]);

  const descriptionValue = useWatch({
    control: form.control,
    name: 'description',
  });
  
  // Get live values from the form for API calls
  const liveProductName = useWatch({ control: form.control, name: 'name' });
  const liveEan = useWatch({ control: form.control, name: 'ean' });
  
  const onSubmit = (data: ProductFormValues) => {
    const finalData: Product = {
      ...(product || {
        id: crypto.randomUUID(),
        tags: [],
        keywords: [],
        supplier: '',
        location: '',
      }),
      ...data,
      technicalSpecs: data.technicalSpecs?.reduce((acc, { key, value }) => {
        if(key) {
            acc[key] = value.includes(',') ? value.split(',').map(s => s.trim()) : value;
        }
        return acc;
      }, {} as Record<string, string | string[]>),
    };
    onSave(finalData);
  };
  
 const handleFindCategory = async () => {
    const productName = liveProductName?.trim();
    if (!productName) {
      toast({
        variant: 'destructive',
        title: 'Missing Product Name',
        description: 'Please enter a product name to find a category.',
      });
      return;
    }
    
    setIsFindingCategory(true);
    try {
      const result = await findEbayCategoryId({ productTitle: productName, ean: liveEan });

      if (result.categoryId) {
        form.setValue("ebayCategoryId", result.categoryId);
        toast({
            title: 'Category Found',
            description: `Set to: ${result.categoryPath} (${result.reason})`,
        });
      } else {
         toast({
            variant: 'destructive',
            title: 'No Suggestions Found',
            description: 'Could not find a matching category.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Category Search Failed',
        description: err.message || 'An error occurred while searching.',
      });
    } finally {
      setIsFindingCategory(false);
    }
  };


  const handleAutocomplete = async (code: string) => {
    if (!code) return;

    const filters = [
        ['Item', 'name', 'like', `%${code}%`],
        ['Item', 'item_code', 'like', `%${code}%`],
    ];
  
    const results = await searchInERPNext(
      'Item',
      filters,
      ['name', 'item_name', 'item_group', 'ean']
    );

    if (results.length > 0) {
      const found = results[0];
      form.setValue('name', found.item_name || found.name, { shouldValidate: true });
      form.setValue('category', found.item_group || '', { shouldValidate: true });
      form.setValue('code', found.name, { shouldValidate: true });
      toast({
        title: 'Autocomplete Success',
        description: `Fields populated based on SKU: ${code}.`,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col"
      >
        <div className="flex-1 overflow-y-auto px-1 py-4">
          <div className="grid grid-cols-12 gap-x-6 gap-y-4 px-6">
            
            {/* Row 1: Product Name & Status */}
            <div className="col-span-12 md:col-span-9">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vintage Leather Wallet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="listingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
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
            </div>
            
            {/* Row 2: Categories */}
            <div className="col-span-12 lg:col-span-7">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Shopify Category</FormLabel>
                          <CategoryCombobox 
                            value={field.value || ''}
                            onChange={(value) => field.onChange(value)}
                          />
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="col-span-12 lg:col-span-5">
                 <FormField
                    control={form.control}
                    name="ebayCategoryId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>eBay Category ID</FormLabel>
                         <div className="flex items-center gap-2">
                            <FormControl>
                                <Input placeholder="e.g. 9355" {...field} />
                            </FormControl>
                             <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-10 w-10 shrink-0"
                                onClick={handleFindCategory}
                                disabled={isFindingCategory || !liveProductName?.trim()}
                                aria-label="Find eBay category"
                                title={!liveProductName?.trim() ? 'Please enter a product name first' : 'Find eBay category'}
                            >
                                {isFindingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            {/* Row 3: Brand, Type, SKU */}
             <div className="col-span-12 md:col-span-3">
               <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (Marke)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Silvercrest" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type (Produktart)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Küchenmaschine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VLW-01" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleAutocomplete(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="col-span-12 md:col-span-3">
              <FormField
                control={form.control}
                name="ean"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EAN</FormLabel>
                    <FormControl>
                      <Input placeholder="Product EAN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Quantity, Price, Image */}
             <div className="col-span-6 md:col-span-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="col-span-6 md:col-span-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Description & Preview */}
            <div className="col-span-12">
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="Provide a detailed product description..."
                        className="min-h-[200px]"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            <div className="col-span-12">
                <FormLabel>Description Preview</FormLabel>
                <Card className="mt-2 h-[224px] overflow-hidden border border-input">
                    <CardContent className="p-0 h-full">
                        <HTMLPreview htmlContent={descriptionValue || '<p class="text-muted-foreground p-4">Start typing a description to see a preview.</p>'} />
                    </CardContent>
                </Card>
            </div>

            {/* Row 6: Technical Specs */}
             <div className="col-span-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Technical Specifications</span>
                   <Button type="button" size="sm" variant="outline" onClick={() => append({ key: '', value: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Spec
                   </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No technical specifications added.</p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`technicalSpecs.${index}.key`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Leistung" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`technicalSpecs.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. 600 W" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
        <SheetFooter className="sticky bottom-0 bg-background/95 backdrop-blur px-6 py-4 border-t">
          <SheetClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit">Save Changes</Button>
        </SheetFooter>
      </form>
    </Form>
  );
}
