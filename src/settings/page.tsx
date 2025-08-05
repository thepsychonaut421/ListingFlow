'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function SettingsClient() {
  const { toast } = useToast();
  const [erpNextUrl, setErpNextUrl] = React.useState('');

  React.useEffect(() => {
    // This will only run on the client side
    setErpNextUrl(process.env.NEXT_PUBLIC_ERPNEXT_URL || '');
  }, []);

  const handleClearData = () => {
    localStorage.removeItem('listingFlowProducts');
    // Note: This does not clear .env variables as they are server-side.
    // Advise user to clear them manually if needed.
    toast({
      title: 'Local Data Cleared',
      description: 'Your local product data has been successfully deleted from the browser. Your API credentials in the .env file are not affected.',
    });
     setTimeout(() => window.location.href = '/', 1000);
  };

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>ERPNext Integration</CardTitle>
          <CardDescription>
            Your ERPNext credentials should be stored securely in an <strong>.env</strong> file in the root of your project. This file is not checked into version control.
            <br /><br />
            You must include the full URL to your ERPNext instance, including the protocol (http/https), in a variable called `NEXT_PUBLIC_ERPNEXT_URL`. This is required for images to load correctly.
             <pre className="mt-2 p-2 bg-muted rounded-md text-sm font-mono">
              NEXT_PUBLIC_ERPNEXT_URL=https://your-erp.rembayer.info<br/>
              ERPNEXT_API_KEY=your_api_key<br/>
              ERPNEXT_API_SECRET=your_api_secret
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Current URL for images: <strong>{erpNextUrl || 'Not set in .env'}</strong>
            </p>
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your application settings and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <p className="text-sm text-muted-foreground">
                This setting is now controlled from the user menu in the header.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
          <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear All Local Product Data
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all your product data
                          from your browser's local storage. Your API credentials in .env will not be affected.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <SettingsClient />
    </main>
  );
}
