'use client';

import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  const handleSaveProduct = (product: Product) => {
    if (selectedProduct) {
      setProducts(products.map((p) => (p.id === product.id ? product : p)));
    } else {
      setProducts([
        { ...product, id: crypto.randomUUID() },
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
        tags: result.tags.split(',').map(t => t.trim()),
        keywords: result.keywords.split(',').map(k => k.trim()),
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

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <div
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
              <span className="sr-only">ListingFlow</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 bg-accent text-accent-foreground"
                >
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="sr-only">Listings</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Listings</TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Tag className="h-5 w-5" />
                  <span className="sr-only">Presets</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Presets</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <File className="h-5 w-5" />
                  <span className="sr-only">Exports</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Exports</TooltipContent>
            </Tooltip>
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </div>
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
                  <div
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <Package className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">ListingFlow</span>
                  </div>
                  <a
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Home className="h-5 w-5" />
                    Dashboard
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Listings
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-foreground"
                  >
                    <Package className="h-5 w-5" />
                    Products
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Tag className="h-5 w-5" />
                    Presets
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </a>
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
