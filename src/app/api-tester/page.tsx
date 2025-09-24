
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageWithAuth } from '@/components/page-with-auth';

function ApiTesterContent() {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState('campaigns');
  const [uid, setUid] = useState('vm551z0vny5b9');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{}');
  const [params, setParams] = useState([{ key: 'page', value: '1' }, { key: 'per_page', value: '10' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<any>(null);

  const handleRunTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setRawResponse(null);
    setRequestInfo(null);

    try {
        const res = await fetch('/api/tester', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method,
                endpoint: endpoint.replace('{uid}', uid),
                params,
                body: method === 'POST' ? JSON.parse(body) : undefined
            })
        });

        const result = await res.json();
        
        setRequestInfo(result.requestInfo);
        
        if (!res.ok) {
            const errorMessage = result.error || 'An unknown error occurred.';
            setError(errorMessage);
            setRawResponse(result.rawResponse || null);
            return;
        }
        
        setResponse(result.data);
        setRawResponse(result.rawResponse);

    } catch (e: any) {
        setError(e.message || 'A client-side error occurred.');
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
  
  const setPreset = (presetEndpoint: string, method: 'GET' | 'POST' = 'GET', presetParams: {key: string, value: string}[] = [], presetBody: string = '{}') => {
    setMethod(method);
    setEndpoint(presetEndpoint);
    setParams(presetParams);
    setBody(presetBody);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans space-y-8">
      <div className="max-w-4xl mx-auto flex justify-end">
        <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">EP MailPro API Tester</CardTitle>
          <CardDescription>
            A utility to test various endpoints and parameters of the EP MailPro API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label className="font-semibold">Test Presets</Label>
              <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreset('campaigns', 'GET', [{key: 'page', value: '1'}, {key: 'per_page', value: '10'}])}>Get Campaigns</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('campaigns/{uid}/stats')}>Get Campaign Stats</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('campaigns/{uid}/unsubscribes')}>Get Campaign Unsubscribes</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists')}>Get Lists</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists/{uid}/subscribers')}>Get Subscribers</Button>
                  <Button variant="outline" size="sm" onClick={() => setPreset('lists/{uid}/subscribers', 'GET', [{key: 'status', value: 'unsubscribed'}])}>Get Unsubscribes</Button>
                  <Button variant="destructive" size="sm" onClick={() => setPreset('lists/{uid}/subscribers', 'POST', [], '{\n  "EMAIL": "example@test.com",\n  "status": "unsubscribed"\n}')}>Create/Unsubscribe Subscriber</Button>
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
        </CardContent>
      </Card>
      
      {requestInfo && (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>API Request Details</CardTitle>
                <CardDescription>The exact URL and headers sent to the API endpoint.</CardDescription>
            </CardHeader>
            <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                    {`URL: ${requestInfo.url}\n\nHeaders:\n${JSON.stringify(requestInfo.headers, null, 2)}`}
                </pre>
            </CardContent>
        </Card>
      )}

      {(error || response || rawResponse) && (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>API Response</CardTitle>
                <CardDescription>The data returned from the API call.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <div>
                        <h4 className="font-semibold text-lg mb-2 text-destructive">Error</h4>
                        <pre className="bg-destructive/10 text-destructive p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">{error}</pre>
                    </div>
                )}
                {response && (
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Parsed JSON Response Body</h4>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">{JSON.stringify(response, null, 2)}</pre>
                    </div>
                )}
                {rawResponse && (
                    <div>
                        <h4 className="font-semibold text-lg mb-2">Raw Response Body</h4>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">{rawResponse}</pre>
                    </div>
                )}
            </CardContent>
        </Card>
      )}

    </div>
  );
}

export default function ApiTesterPage() {
  return (
    <PageWithAuth>
      <ApiTesterContent />
    </PageWithAuth>
  );
}
