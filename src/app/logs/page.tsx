// src/app/logs/page.tsx
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, ServerCrash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type LogEvent = {
  timestamp: string;
  level: 'info' | 'success' | 'error';
  message: string;
  details?: Record<string, any>;
};

function LogsClient() {
  const [events, setEvents] = React.useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data: LogEvent[] = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load log events. Please try again.',
      });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const levelConfig = {
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    error: { icon: ServerCrash, color: 'text-red-500', bg: 'bg-red-500/10' },
    info: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhook Logs</CardTitle>
            <CardDescription>
              Real-time events from the Shopify to ERPNext integration pipeline.
            </CardDescription>
          </div>
          <Button onClick={() => fetchEvents()} disabled={isLoading} size="sm" variant="outline">
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
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && events.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p>No log events found.</p>
              <p className="text-xs">Trigger a new order in Shopify to see events here.</p>
            </div>
          )}

          {!isLoading && events.map((event, index) => {
            const config = levelConfig[event.level] || levelConfig.info;
            const Icon = config.icon;
            return (
              <div key={index} className={`p-4 rounded-lg border ${config.bg}`}>
                <div className="flex items-start gap-4">
                  <Icon className={`mt-1 h-5 w-5 shrink-0 ${config.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{event.message}</p>
                      <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                        {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </Badge>
                    </div>
                    {event.details && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-muted-foreground">Details</summary>
                        <pre className="mt-1 p-3 bg-background/50 rounded-md whitespace-pre-wrap font-mono text-foreground/80 break-all">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LogsPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <LogsClient />
    </main>
  );
}
