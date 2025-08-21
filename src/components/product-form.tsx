
'use client';

import * as React from 'react';
import { useForm, FormProvider, useWatch, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Product, ProductImage } from '@/lib/types';
import {
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Loader2, Search, Trash2, Upload, Star } from 'lucide-react';
import { HTMLPreview } from './html-preview';
import { CategoryCombobox } from './category-combobox';


const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  listingStatus: z.enum(['draft', 'listed', 'error', 'new', 'used', 'refurbished', 'active', 'archived']).default('draft'),
  category: z.string().optional(), // Shopify Category
  ebayCategoryId: z.string().optional(),
  code: z.string().optional(), // SKU
  images: z.array(z.object({ url: z.string(), isMain: z.boolean() })).optional(),
  price: z.number().or(z.string()).optional(),
  quantity: z.number().or(z.string()).optional(),
  description: z.string().optional(),
  technicalSpecs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  ean: z.string().optional(),
});
type ProductFormValues = z.infer<typeof ProductSchema>;

async function resolveEbayCategory(
  name: string
): Promise<{ id?: string; path?: string }> {
  const r = await fetch('/api/ebay/category/suggest?name=' + encodeURIComponent(name));
  if (!r.ok) return {};
  const data = await r.json();
  return data ?? {};
}

const toProductFormValues = (product: Product | null): ProductFormValues => {
    const technicalSpecs = product?.technicalSpecs 
        ? Object.entries(product.technicalSpecs).map(([key, value]) => ({ 
              key, 
              value: Array.isArray(value) ? value.join(', ') : String(value) 
          }))
        : [];
        
    return {
        id: product?.id || '',
        name: product?.name || '',
        listingStatus: product?.listingStatus || 'draft',
        category: product?.category || '',
        ebayCategoryId: product?.ebayCategoryId || '',
        code: product?.code || '',
        images: product?.images || [],
        price: product?.price || 0,
        quantity: product?.quantity || 0,
        description: product?.description || '',
        technicalSpecs: technicalSpecs,
        ean: product?.ean || '',
    };
};

// New Component for Image Upload
function ImageUploader({ control, setValue, getValues }: { control: any; setValue: any, getValues: any }) {
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "images"
    });
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Invalid File', description: `${file.name} is not an image.`});
                continue;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof e.target?.result === 'string') {
                    // If it's the first image, mark it as main
                    const isFirstImage = fields.length === 0;
                    append({ url: e.target.result, isMain: isFirstImage });
                }
            };
            reader.onerror = () => {
                 toast({ variant: 'destructive', title: 'Read Error', description: `Could not read file ${file.name}.`});
            }
            reader.readAsDataURL(file);
        }
    };
    
    const handleSetMain = (indexToSet: number) => {
      const currentImages = getValues('images') as ProductImage[];
      const updatedImages = currentImages.map((img, index) => ({
        ...img,
        isMain: index === indexToSet,
      }));
      setValue('images', updatedImages, { shouldDirty: true });
    };
    
    const handleRemove = (indexToRemove: number) => {
        const currentImages = getValues('images') as ProductImage[];
        const wasMain = currentImages[indexToRemove]?.isMain;
        remove(indexToRemove);

        // If the removed image was the main one, set the new first image as main
        if (wasMain && fields.length > 1) {
            handleSetMain(0);
        }
    };

    return (
        <section className="space-y-3 px-6 mt-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground">Product Images</h3>
                 <Button type="button" size="sm" variant="outline" asChild>
                    <label>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                        />
                    </label>
                </Button>
            </div>
            {fields.length > 0 && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative group aspect-square">
                            <img src={field.url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover rounded-md border" />
                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6",
                                        field.isMain && "bg-amber-400 hover:bg-amber-500 text-black"
                                    )}
                                    onClick={() => handleSetMain(index)}
                                    title="Set as main image"
                                >
                                    <Star className="h-3 w-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleRemove(index)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            {field.isMain && (
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-400" />
                                    Main
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}


export function ProductForm({
  product,
  onSave,
  onCancel
}: {
  product: Product | null;
  onSave: (data: Product) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: toProductFormValues(product)
  });

  const {
    handleSubmit,
    register,
    setValue,
    control,
    getValues,
    formState: { isSubmitting, errors },
  } = methods;
  
   const { fields: techSpecFields, append: appendTechSpec, remove: removeTechSpec } = useFieldArray({
    control: control,
    name: "technicalSpecs",
  });

  const productName = useWatch({ control: methods.control, name: 'name' });
  const ebayCategoryId = useWatch({ control: methods.control, name: 'ebayCategoryId' });
  const descriptionValue = useWatch({ control, name: 'description' });

  const [ebayPath, setEbayPath] = React.useState<string>('');
  const [isFindingCategory, setIsFindingCategory] = React.useState(false);


  const onFindEbayCategory = async () => {
    const name = (productName || '').trim();
    if (!name) {
      toast({ variant: 'destructive', title: 'Product Name required', description: 'Please enter a Product Name before searching for a category.' });
      return;
    }
    setIsFindingCategory(true);
    try {
        const { id, path } = await resolveEbayCategory(name);
        if (!id) {
            toast({ variant: 'destructive', title: 'No Suggestions Found', description: 'Could not find a suitable eBay category.'});
            return;
        }
        setValue('ebayCategoryId', String(id), { shouldDirty: true, shouldValidate: true });
        setEbayPath(path || '');
        toast({ title: 'eBay Category Detected', description: `Set to: ${path}` });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch eBay category suggestions.' });
    } finally {
        setIsFindingCategory(false);
    }
  };

  React.useEffect(() => {
    (async () => {
      if (!ebayCategoryId) {
        setEbayPath('');
        return;
      };
      try {
        const r = await fetch(`/api/ebay/category/path?id=${ebayCategoryId}`);
        if (r.ok) {
          const d = await r.json();
          setEbayPath(d?.path ?? '');
        }
      } catch {}
    })();
  }, [ebayCategoryId]);
  
  React.useEffect(() => {
    methods.reset(toProductFormValues(product));
  }, [product, methods]);
  
  const processSubmit = (data: ProductFormValues) => {
    const finalData: Product = {
      id: product?.id ?? crypto.randomUUID(),
      name: data.name ?? "",
      code: data.code ?? "",
      price: Number(data.price ?? 0),
      quantity: Number(data.quantity ?? 0),
      description: data.description ?? "",
      images: data.images || [],
      listingStatus: data.listingStatus as Product["listingStatus"],
      category: data.category ?? "",
      ebayCategoryId: data.ebayCategoryId ?? "",
      tags: product?.tags ?? [],
      keywords: product?.keywords ?? [],
      supplier: product?.supplier ?? "",
      location: product?.location ?? "",
      technicalSpecs: (data.technicalSpecs || []).reduce((acc, { key, value }) => {
        if (key) {
            acc[key] = value.includes(',') ? value.split(',').map(s => s.trim()) : value;
        }
        return acc;
      }, {} as Record<string, string | string[]>),
      sourceModified: product?.sourceModified ?? new Date().toISOString(),
      ean: data.ean ?? undefined,
    };
    onSave(finalData);
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(processSubmit)}
        className="flex h-full flex-col"
      >
       <div className="flex-1 overflow-y-auto px-1 py-4">
        <section className="space-y-4 px-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <Label>Product Name</Label>
              <Input placeholder="e.g. CRIVIT Inlineskates..." {...register('name')} />
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label>Status</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('listingStatus')}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="new">New (Condition)</option>
                <option value="used">Used (Condition)</option>
                <option value="refurbished">Refurbished (Condition)</option>
                 <option value="listed">Listed (Legacy)</option>
                 <option value="error">Error (Internal)</option>
              </select>
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label>SKU</Label>
              <Input placeholder="SKU" {...register('code')} />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Label>Shopify Category</Label>
               <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <CategoryCombobox
                        value={field.value || ''}
                        onChange={field.onChange}
                    />
                  )}
                />
            </div>

            <div className="col-span-12 md:col-span-6">
                <div className="flex items-center justify-between">
                    <Label>eBay Category ID</Label>
                    <Button type="button" size="sm" variant="outline" onClick={onFindEbayCategory} disabled={isFindingCategory}>
                         {isFindingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Find
                    </Button>
                </div>
              <Input placeholder="e.g. 9355" {...register('ebayCategoryId')} />
              {ebayPath && (
                <p className="text-xs text-muted-foreground mt-1 truncate" title={ebayPath}>
                  {ebayPath}
                </p>
              )}
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label>Quantity</Label>
              <Input type="number" inputMode="numeric" {...register('quantity')} />
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label>Price</Label>
              <Input type="number" step="0.01" inputMode="decimal" {...register('price')} />
            </div>
            
            <div className="col-span-6 md:col-span-3">
              <Label>EAN</Label>
              <Input placeholder="EAN/UPC" {...register('ean')} />
            </div>
          </div>
        </section>
        
        <ImageUploader control={control} setValue={setValue} getValues={getValues} />

        <section className="space-y-3 px-6 mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-6">
              <Textarea rows={8} placeholder="Provide a detailed product description..." {...register('description')} />
            </div>
            <div className="col-span-12 lg:col-span-6">
                 <div className="text-sm text-muted-foreground mb-2">Preview</div>
                 <div className="rounded-md border p-3 text-sm h-[196px] overflow-auto prose prose-sm max-w-none">
                   <HTMLPreview htmlContent={descriptionValue || '<p class="text-muted-foreground">Start typing a description to see a preview.</p>'} />
                </div>
            </div>
          </div>
        </section>

        <section className="space-y-3 px-6 mt-6">
           <div className="flex justify-between items-center">
             <h3 className="text-sm font-medium text-muted-foreground">Technical Specifications</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => appendTechSpec({ key: '', value: '' })}>
                <Upload className="mr-2 h-4 w-4" />
                Add Spec
             </Button>
           </div>
           
            <div className="space-y-2">
                {techSpecFields.length === 0 && (
                <div className="text-sm text-center text-muted-foreground py-4">No technical specifications added.</div>
                )}
                {techSpecFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-5" placeholder="Key (e.g. Marke)" {...register(`technicalSpecs.${index}.key` as const)} />
                    <Input className="col-span-6" placeholder="Value (e.g. CRIVIT)" {...register(`technicalSpecs.${index}.value` as const)} />
                    <Button type="button" variant="destructive" size="icon" className="col-span-1 h-9 w-9" onClick={() => removeTechSpec(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))}
            </div>
        </section>
        </div>

        <SheetFooter className="sticky bottom-0 bg-background/95 backdrop-blur px-6 py-4 border-t">
          <SheetClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </SheetFooter>
      </form>
    </FormProvider>
  );
}
