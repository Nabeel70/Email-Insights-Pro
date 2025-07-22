'use client';

import { useState } from 'react';
import { testEndpoint } from '@/lib/epmailpro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader, PlusCircle, Trash2 } from 'lucide-react';

type TestResult = {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: any;
  error?: string;
  status?: number;
};

export default function TestApiPage() {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [endpoint, setEndpoint] = useState('campaigns');
  const [params, setParams] = useState<{ key: string; value: string }[]>([
    { key: 'page', value: '1' },
    { key: 'per_page', value: '10' },
  ]);
  const [body, setBody] = useState('{\n  "key": "value"\n}');
  const [result, setResult] = useState<TestResult | null>(null);

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '' }]);
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    setParams(newParams);
  };

  const handleRunTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const paramsObject = params.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      let parsedBody = null;
      if (method === 'POST') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON in request body.');
        }
      }

      const response = await testEndpoint(method, endpoint, paramsObject, parsedBody);
      
      const url = new URL(`https://app.epmailpro.com/api/index.php/${endpoint}`);
      Object.entries(paramsObject).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      setResult({
        request: {
          method,
          url: url.toString(),
          headers: { 'X-MW-PUBLIC-KEY': 'YOUR_KEY_HERE', 'Content-Type': 'application/json' },
          ...(method === 'POST' && { body: parsedBody }),
        },
        response
      });

    } catch (error) {
       setResult({ 
        request: { url: `/${endpoint}`, headers: {}, method },
        response: {},
        error: (error as Error).message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>EP MailPro API Explorer</CardTitle>
          <CardDescription>
            A tool to test various endpoints, methods, and parameters for the EP MailPro API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <Label htmlFor="method" className="text-base font-medium">HTTP Method</Label>
               <RadioGroup defaultValue="GET" onValueChange={(value: 'GET' | 'POST') => setMethod(value)} className="flex items-center gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GET" id="r1" />
                  <Label htmlFor="r1">GET</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="POST" id="r2" />
                  <Label htmlFor="r2">POST</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="endpoint" className="text-base font-medium">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="e.g., campaigns, lists, etc."
                className="mt-2"
              />
            </div>

            {method === 'GET' && (
              <div>
                <Label className="text-base font-medium">Query Parameters</Label>
                <div className="mt-2 grid gap-4">
                  {params.map((param, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        placeholder="Key (e.g., page)"
                      />
                      <Input
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        placeholder="Value (e.g., 1)"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeParam(index)} aria-label="Remove parameter">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addParam}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Parameter
                  </Button>
                </div>
              </div>
            )}

            {method === 'POST' && (
              <div>
                <Label htmlFor="body" className="text-base font-medium">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-2 font-mono"
                  rows={8}
                />
              </div>
            )}


            <Button onClick={handleRunTest} disabled={loading} size="lg">
              {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Run Test
            </Button>

            {result && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                
                {result.error && (
                   <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm text-destructive-foreground bg-transparent p-0">
                        {result.error}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <h4 className="font-medium">Request Details:</h4>
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(result.request, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium">Response Body:</h4>
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}