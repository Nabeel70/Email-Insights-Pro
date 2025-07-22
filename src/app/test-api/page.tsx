
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { makeApiRequest } from '@/lib/epmailpro';
import { Loader } from 'lucide-react';

export default function TestApiPage() {
  const [endpoint, setEndpoint] = useState('campaigns');
  const [uid, setUid] = useState('vm551z0vny5b9');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{}');
  const [params, setParams] = useState([{ key: 'page', value: '1' }, { key: 'per_page', value: '10' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const finalEndpoint = endpoint.replace('{uid}', uid);
    
    // Convert params array to object for the API function
    const queryParams = method === 'GET' ? params.reduce((acc, p) => {
        if (p.key) acc[p.key] = p.value;
        return acc;
    }, {} as Record<string, string>) : {};
    
    // Parse body for POST request
    let requestBody = null;
    if (method === 'POST') {
        try {
            requestBody = JSON.parse(body);
        } catch (e) {
            setError('Invalid JSON in request body.');
            setIsLoading(false);
            return;
        }
    }

    try {
      const result = await makeApiRequest(method, finalEndpoint, queryParams, requestBody);
      setResponse(result.data);
      setRequestInfo(result.requestInfo);
    } catch (e: any) {
      setError(e.message);
      setRequestInfo(e.requestInfo);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const addParam = () => setParams([...params, { key: '', value: '' }]);
  const removeParam = (index: number) => setParams(params.filter((_, i) => i !== index));
  
  const setPreset = (presetEndpoint: string, presetParams: {key: string, value: string}[] = []) => {
    setMethod('GET');
    setEndpoint(presetEndpoint);
    setParams(presetParams);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">EP MailPro API Test Page</CardTitle>
          <CardDescription>
            A utility to test various endpoints and parameters of the EP MailPro API.
            The correct authentication (`X-MW-PUBLIC-KEY`) is automatically applied.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label className="font-semibold">Test Presets</Label>
              <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreset('campaigns', [{key: 'page', value: '1'}, {key: 'per_page', value: '10'}])}>Get Campaigns</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('campaigns/{uid}/stats')}>Get Campaign Stats</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists')}>Get Lists</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists/{uid}/subscribers')}>Get Subscribers</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists/{uid}/subscribers', [{key: 'status', value: 'unsubscribed'}])}>Get Unsubscribes</Button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="endpoint">Endpoint Path</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="e.g., campaigns or lists/{uid}/subscribers"
              />
            </div>
          </div>

           <div className="space-y-2">
              <Label htmlFor="uid">Campaign/List UID (replaces `'{uid}'` in path)</Label>
              <Input
                id="uid"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Enter a specific UID to test"
              />
            </div>

          {method === 'GET' && (
            <div className="space-y-4">
              <Label>Query Parameters</Label>
              {params.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={p.key} onChange={(e) => handleParamChange(i, 'key', e.target.value)} placeholder="Key" />
                  <Input value={p.value} onChange={(e) => handleParamChange(i, 'value', e.target.value)} placeholder="Value" />
                  <Button variant="destructive" size="sm" onClick={() => removeParam(i)}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addParam}>Add Parameter</Button>
            </div>
          )}

          {method === 'POST' && (
            <div className="space-y-2">
              <Label htmlFor="body">Request Body (JSON)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder='{ "key": "value" }'
              />
            </div>
          )}

          <Button onClick={handleRunTest} disabled={isLoading} className="w-full">
            {isLoading ? <Loader className="animate-spin" /> : 'Run Test'}
          </Button>

          {(requestInfo || error || response) && (
            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-xl font-semibold">Results</h3>
              {requestInfo && (
                <div>
                  <h4 className="font-semibold text-lg mb-2">Request Info</h4>
                   <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    {`URL: ${requestInfo.url}\n\nHeaders:\n${JSON.stringify(requestInfo.headers, null, 2)}`}
                   </pre>
                </div>
              )}
              {error && (
                 <div>
                    <h4 className="font-semibold text-lg mb-2 text-destructive">Error</h4>
                    <pre className="bg-destructive/10 text-destructive p-4 rounded-md text-sm overflow-x-auto">{error}</pre>
                </div>
              )}
              {response && (
                <div>
                    <h4 className="font-semibold text-lg mb-2">Response Body</h4>
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
