'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  File,
  Home,
  Package,
  PanelLeft,
  PlusCircle,
  Settings,
  ShoppingCart,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { Product } from '@/lib/types';
import { initialProducts } from '@/lib/data';
import { ProductDataTable } from '@/components/product-data-table';
import { getColumns } from '@/components/product-columns';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/product-form';

export default function Dashboard() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [generatingProductId, setGeneratingProductId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();

  React.useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('listingFlowProducts');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(initialProducts);
      }
    } catch (error) {
      console.error('Failed to parse products from localStorage', error);
      setProducts(initialProducts);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('listingFlowProducts', JSON.stringify(products));
    }
  }, [products, isLoading]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsSheetOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsSheetOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleSaveProduct = (productData: Omit<Product, 'tags' | 'keywords'> & { tags?: string | string[], keywords?: string | string[] }) => {
    const productToSave: Product = {
        ...productData,
        id: productData.id || crypto.randomUUID(),
        tags: Array.isArray(productData.tags) ? productData.tags : (productData.tags?.split(',').map(t => t.trim()).filter(t => t) || []),
        keywords: Array.isArray(productData.keywords) ? productData.keywords : (productData.keywords?.split(',').map(k => k.trim()).filter(k => k) || []),
        supplier: productData.supplier || '',
        location: productData.location || '',
    };
    
    if (selectedProduct) {
        setProducts(products.map((p) => (p.id === productToSave.id ? productToSave : p)));
    } else {
        setProducts([
            productToSave,
            ...products,
        ]);
    }
    setIsSheetOpen(false);
    setSelectedProduct(null);
  };
  
  const handleGenerateDescription = async (product: Product) => {
    setGeneratingProductId(product.id);
    try {
      const result = await generateProductDescription({
        productName: product.name,
        category: product.category,
        listingStatus: product.listingStatus as 'new' | 'used' | 'refurbished',
      });
      
      setProducts(products.map(p => p.id === product.id ? {
        ...p,
        description: result.description,
        tags: Array.isArray(result.tags) ? result.tags : [],
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        category: result.category,
      } : p));

      toast({
        title: 'AI Magic Successful!',
        description: `Description for "${product.name}" has been generated.`,
      });

    } catch (error) {
      console.error('Failed to generate description:', error);
      toast({
        variant: 'destructive',
        title: 'AI Magic Failed',
        description: 'Could not generate a new description. Please try again.',
      });
    } finally {
      setGeneratingProductId(null);
    }
  };


  const columns = React.useMemo(() => getColumns({
      onEdit: handleEditProduct,
      onDelete: handleDeleteProduct,
      onGenerate: handleGenerateDescription,
      generatingProductId,
  }), [generatingProductId, products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading Products...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/listings', icon: ShoppingCart, label: 'Listings' },
    { href: '#', icon: Tag, label: 'Presets' },
    { href: '#', icon: File, label: 'Exports' },
  ];

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="/"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">ListingFlow</span>
            </Link>
            {navItems.map((item) => (
              <Tooltip key={`${item.href}-${item.label}`}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                      pathname === item.href && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                     pathname === '/settings' && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                 <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="/"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Package className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">ListingFlow</span>
                  </Link>
                  {navItems.map((item) => (
                     <Link
                      key={`${item.href}-${item.label}`}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                        pathname === item.href && 'text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                   <Link
                      href="/settings"
                      className={cn(
                        'flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground',
                        pathname === '/settings' && 'text-foreground'
                      )}
                    >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="relative ml-auto flex-1 md:grow-0">
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <img
                    src="https://placehold.co/36x36.png"
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>
                    Manage your products and their listing details.
                  </CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                    </span>
                  </Button>
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                       <Button size="sm" className="h-8 gap-1" onClick={handleAddProduct}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                          Add Product
                        </span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-2xl" side="right">
                      <SheetHeader>
                         <SheetTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
                        <SheetDescription>
                          {selectedProduct
                            ? 'Update the details of your product.'
                            : 'Fill in the details for the new product.'}
                        </SheetDescription>
                      </SheetHeader>
                      <ProductForm 
                        product={selectedProduct} 
                        onSave={handleSaveProduct} 
                        onCancel={() => setIsSheetOpen(false)} 
                      />
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent>
                <ProductDataTable columns={columns} data={products} />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
