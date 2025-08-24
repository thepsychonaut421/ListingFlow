// src/app/listings/page.tsx
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type Order = {
  name: string;
  customer: string;
  transaction_date: string;
  status: string;
  delivery_status: string;
  grand_total: number;
  currency: string;
};

function OrdersClient() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/erpnext/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not load orders: ${error.message}`,
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };
  
    const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Paid': 'default',
    'Bezahlt': 'default',
    'Draft': 'secondary',
    'Unpaid': 'outline',
    'Overdue': 'destructive',
    'To Deliver': 'outline',
    'To Ship': 'outline',
    'Delivered': 'default',
    'Shipped': 'default',
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              View Sales Orders synchronized from Shopify to ERPNext.
            </CardDescription>
          </div>
          <Button onClick={fetchOrders} disabled={isLoading} size="sm" variant="outline">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.name}>
                    <TableCell className="font-medium">{order.name}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      {format(new Date(order.transaction_date), 'dd.MM.yyyy')}
                    </TableCell>
                     <TableCell>
                      <Badge variant={statusVariantMap[order.status] || 'outline'} className="capitalize">{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[order.delivery_status] || 'outline'} className="capitalize">{order.delivery_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.grand_total, order.currency)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <OrdersClient />
    </main>
  );
}
