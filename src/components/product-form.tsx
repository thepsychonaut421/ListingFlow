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
import { HTMLPreview } from './html-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { findEbayCategoryId } from '@/ai/flows/find-ebay-category-id';
import { findEan } from '@/ai/flows/find-ean';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Copy, Trash2, PlusCircle } from 'lucide-react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { useErpData } from '@/contexts/erp-data-context';
import { searchInERPNext } from '@/lib/erpnext';


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
  ean: z.string().optional(),
  technicalSpecs: z.array(z.object({
    key: z.string().min(1, 'Key cannot be empty'),
    value: z.string().min(1, 'Value cannot be empty'),
  })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSave: (data: Product) => void;
  onCancel: () => void;
}

function CategoryFinder({ onSelectCategory }: { onSelectCategory: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [result, setResult] = React.useState<{ ebayCategoryId: string; categoryPath: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a product description to search.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const res = await findEbayCategoryId({ productDescription: searchTerm });
      setResult(res);
    } catch (err) {
      console.error(err);
      setError('Could not find a category. Please try a different search term.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    toast({
        title: 'Copied!',
        description: 'Category ID copied to clipboard.',
    });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Find eBay Category</DialogTitle>
        <DialogDescription>
          Describe your product, and we'll find the most relevant eBay category ID for you.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex items-center space-x-2">
          <Input
            id="category-search"
            placeholder="e.g., men's leather watch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="sr-only">Search</span>
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {result && (
        <Card>
          <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold">Suggested Category</h4>
              <p className="text-sm text-muted-foreground">{result.categoryPath}</p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-lg font-bold font-mono bg-muted px-2 py-1 rounded-md">{result.ebayCategoryId}</p>
                <CopyToClipboard text={result.ebayCategoryId} onCopy={handleCopyToClipboard}>
                    <Button variant="outline" size="sm">
                        <Copy className="mr-2 h-4 w-4" /> Copy ID
                    </Button>
                </CopyToClipboard>
              </div>
          </CardContent>
        </Card>
      )}
      <DialogFooter>
         {result && (
            <Button onClick={() => onSelectCategory(result.ebayCategoryId)}>Use This Category ID</Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}


export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [isCategoryFinderOpen, setIsCategoryFinderOpen] = React.useState(false);
  const [isFindingEan, setIsFindingEan] = React.useState(false);
  const { toast } = useToast();
  const { erpData, setErpData } = useErpData();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
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
      technicalSpecs: product?.technicalSpecs ? Object.entries(product.technicalSpecs).map(([key, value]) => ({ key, value })) : [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "technicalSpecs",
  });

  const descriptionValue = useWatch({
    control: form.control,
    name: 'description',
  });

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
        if(key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>),
    };
    onSave(finalData);
  };
  
  const handleSelectCategory = (categoryId: string) => {
    form.setValue('ebayCategoryId', categoryId, { shouldValidate: true });
    setIsCategoryFinderOpen(false);
  };

  const handleFindEan = async () => {
    const productName = form.getValues('name');
    const brand = form.getValues('brand');
    if (!productName) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please enter a product name before finding the EAN.',
        });
        return;
    }
    setIsFindingEan(true);
    try {
        const result = await findEan({ productName, brand });
        if (result.ean) {
            form.setValue('ean', result.ean, { shouldValidate: true });
            toast({
                title: 'EAN Found!',
                description: `The EAN ${result.ean} has been filled in.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'EAN Not Found',
                description: 'Could not find an EAN for this product.',
            });
        }
    } catch (error) {
        console.error('Failed to find EAN:', error);
        toast({
            variant: 'destructive',
            title: 'EAN Search Failed',
            description: 'An error occurred while searching for the EAN.',
        });
    } finally {
        setIsFindingEan(false);
    }
  };

  const handleAutocomplete = async (code: string) => {
    if (!code) return;

    // Search by both SKU (name in ERPNext) and EAN
    const filters = [
        ['Item', 'name', 'like', `%${code}%`],
        ['Item', 'ean', 'like', `%${code}%`],
    ];
  
    const results = await searchInERPNext(
      'Item',
      filters,
      ['name', 'item_name', 'item_group', 'brand', 'ean']
    );

    if (results.length > 0) {
      const found = results[0]; // Use the first result
      form.setValue('name', found.item_name || found.name, { shouldValidate: true });
      form.setValue('category', found.item_group || '', { shouldValidate: true });
      form.setValue('code', found.name, { shouldValidate: true });
      form.setValue('brand', found.brand || '', { shouldValidate: true });
      form.setValue('ean', found.ean || '', { shouldValidate: true });
      toast({
        title: 'Autocomplete Success',
        description: `Fields populated based on SKU/EAN: ${code}.`,
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
          <div className="grid gap-6 px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. Men's Accessories" {...field} />
                        </FormControl>
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
                        <div className="flex items-center space-x-2">
                            <FormControl>
                                <Input placeholder="e.g. 2977" {...field} />
                            </FormControl>
                            <Dialog open={isCategoryFinderOpen} onOpenChange={setIsCategoryFinderOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline">
                                        <Search className="mr-2 h-4 w-4" /> Find ID
                                    </Button>
                                </DialogTrigger>
                                <CategoryFinder onSelectCategory={handleSelectCategory} />
                            </Dialog>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (Marke)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Silvercrest, Unbranded" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type (Produktart)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Küchenmaschine, Wallet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <FormField
                control={form.control}
                name="ean"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EAN / UPC</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="e.g. 4056233833446" 
                          {...field} 
                           onChange={(e) => {
                            field.onChange(e);
                            handleAutocomplete(e.target.value);
                          }}
                        />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={handleFindEan} disabled={isFindingEan}>
                        {isFindingEan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Find EAN
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

              <div className="space-y-2">
                <FormLabel>Description Preview</FormLabel>
                <Card className="h-[224px] overflow-hidden">
                  <CardContent className="p-0 h-full">
                      <HTMLPreview htmlContent={descriptionValue || '<p class="text-muted-foreground p-4">Start typing a description to see a preview.</p>'} />
                  </CardContent>
                </Card>
              </div>
            </div>

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
        <SheetFooter className="sticky bottom-0 bg-background px-6 py-4 border-t">
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
