'use client';

import { PageWithAuth } from '@/components/page-with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Key, 
  Bell, 
  Database, 
  Clock,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Mail,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  return (
    <PageWithAuth>
      <SettingsContent />
    </PageWithAuth>
  );
}

function SettingsContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  // User Profile Settings
  const [displayName, setDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // API Configuration
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // Notification Preferences
  const [emailReports, setEmailReports] = useState(true);
  const [syncNotifications, setSyncNotifications] = useState(false);
  const [errorNotifications, setErrorNotifications] = useState(true);

  // Data Management Settings
  const [defaultExportFormat, setDefaultExportFormat] = useState('csv');
  const [autoSync, setAutoSync] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('hourly');
  const [dataRetention, setDataRetention] = useState('1year');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
      setDisplayName(user.displayName || '');
      
      // Load settings from localStorage or API
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = () => {
    try {
      // Load from localStorage for demo purposes
      // In production, this would come from a user settings API/database
      const savedSettings = localStorage.getItem('emailInsightsSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setApiKey(settings.apiKey || '');
        setEmailReports(settings.emailReports ?? true);
        setSyncNotifications(settings.syncNotifications ?? false);
        setErrorNotifications(settings.errorNotifications ?? true);
        setDefaultExportFormat(settings.defaultExportFormat || 'csv');
        setAutoSync(settings.autoSync ?? true);
        setSyncFrequency(settings.syncFrequency || 'hourly');
        setDataRetention(settings.dataRetention || '1year');
        setLastUpdated(settings.lastUpdated ? new Date(settings.lastUpdated).toLocaleDateString() : 'Never');
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settings = {
        apiKey,
        emailReports,
        syncNotifications,
        errorNotifications,
        defaultExportFormat,
        autoSync,
        syncFrequency,
        dataRetention,
        lastUpdated: new Date().toISOString()
      };

      // Save to localStorage for demo purposes
      // In production, this would save to user settings API/database
      localStorage.setItem('emailInsightsSettings', JSON.stringify(settings));
      
      // Update the lastUpdated state
      setLastUpdated(new Date().toLocaleDateString());

      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter an API key to test.',
        variant: 'destructive',
      });
      return;
    }

    setTestingApi(true);
    try {
      // Test API key by making a request to EP MailPro
      const response = await fetch('/api/tester', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey,
          endpoint: 'campaigns',
          params: { per_page: 1 }
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setApiStatus('valid');
        toast({
          title: 'API Key Valid',
          description: 'Successfully connected to EP MailPro.',
        });
      } else {
        setApiStatus('invalid');
        toast({
          title: 'API Key Invalid',
          description: result.error || 'Failed to connect to EP MailPro.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setApiStatus('invalid');
      console.error('API test error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to test API connection.',
        variant: 'destructive',
      });
    } finally {
      setTestingApi(false);
    }
  };

  const resetSettings = () => {
    setEmailReports(true);
    setSyncNotifications(false);
    setErrorNotifications(true);
    setDefaultExportFormat('csv');
    setAutoSync(true);
    setSyncFrequency('hourly');
    setDataRetention('1year');
    setLastUpdated('Never');
    
    // Clear localStorage
    localStorage.removeItem('emailInsightsSettings');
    
    toast({
      title: 'Settings Reset',
      description: 'Settings have been reset to defaults.',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>
              Manage your account information and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  value={userEmail}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure your EP MailPro API connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">EP MailPro API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your EP MailPro API key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={testApiKey}
                  disabled={testingApi || !apiKey.trim()}
                  variant="outline"
                >
                  {testingApi ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span className="ml-2">{testingApi ? 'Testing...' : 'Test'}</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    apiStatus === 'valid' ? 'default' : 
                    apiStatus === 'invalid' ? 'destructive' : 
                    'secondary'
                  }
                >
                  {apiStatus === 'valid' ? 'Valid' : 
                   apiStatus === 'invalid' ? 'Invalid' : 
                   'Not Tested'}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  API key is used to sync data from EP MailPro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="emailReports">Daily Email Reports</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive daily campaign performance reports via email
                </p>
              </div>
              <Switch
                id="emailReports"
                checked={emailReports}
                onCheckedChange={setEmailReports}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="syncNotifications">Sync Notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get notified when data sync completes successfully
                </p>
              </div>
              <Switch
                id="syncNotifications"
                checked={syncNotifications}
                onCheckedChange={setSyncNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="errorNotifications">Error Notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive alerts when sync or other operations fail
                </p>
              </div>
              <Switch
                id="errorNotifications"
                checked={errorNotifications}
                onCheckedChange={setErrorNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Configure data synchronization and storage preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultExportFormat">Default Export Format</Label>
                <Select value={defaultExportFormat} onValueChange={setDefaultExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        CSV (Excel Compatible)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        JSON (Structured Data)
                      </div>
                    </SelectItem>
                    <SelectItem value="xml">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        XML (Markup Format)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="autoSync">Automatic Data Sync</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically sync data from EP MailPro on schedule
                </p>
              </div>
              <Switch
                id="autoSync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>
            
            {autoSync && (
              <div className="space-y-2">
                <Label htmlFor="syncFrequency">Sync Frequency</Label>
                <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="30min">Every 30 minutes</SelectItem>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  More frequent syncing may impact API rate limits
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              Application version and system details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-medium">Application Version</Label>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Settings Update</Label>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.uid?.substring(0, 8) || 'Unknown'}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
