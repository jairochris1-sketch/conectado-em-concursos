import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

/**
 * Test Helper Component for Study Partner Messaging System
 * Run these tests to validate the complete messaging flow
 */

export default function StudyPartnerTestHelper() {
  const [userAEmail, setUserAEmail] = useState("");
  const [userBEmail, setUserBEmail] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (action, label) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('validateStudyPartnerSystem', {
        action,
        userAEmail,
        userBEmail
      });
      
      setResults(prev => [...prev, {
        label,
        action,
        result: response.data,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        label,
        action,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    setResults([]);
    
    const tests = [
      ['test_accepted_messaging', '✔ Partnership Accepted'],
      ['test_message_saved', '✔ Message Persistence'],
      ['test_rls_permissions', '✔ RLS Permissions'],
      ['test_conversation_key_format', '✔ Conversation Key Format'],
      ['full_diagnostic', '📊 Full Diagnostic Report']
    ];

    for (const [action, label] of tests) {
      await runTest(action, label);
      await new Promise(r => setTimeout(r, 300)); // Small delay between tests
    }
    
    setLoading(false);
  };

  const getStatusIcon = (result) => {
    if (result.error) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (result.result?.success === false) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Study Partner Messaging System - Test Suite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">User A Email</label>
            <Input
              value={userAEmail}
              onChange={(e) => setUserAEmail(e.target.value)}
              placeholder="user.a@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">User B Email</label>
            <Input
              value={userBEmail}
              onChange={(e) => setUserBEmail(e.target.value)}
              placeholder="user.b@example.com"
              className="mt-1"
            />
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => runTest('test_accepted_messaging', '✔ Test: Partnership Accepted')}
            disabled={!userAEmail || !userBEmail || loading}
            variant="outline"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test Acceptance
          </Button>
          <Button
            onClick={() => runTest('test_message_saved', '✔ Test: Message Saved')}
            disabled={!userAEmail || !userBEmail || loading}
            variant="outline"
          >
            Test Persistence
          </Button>
          <Button
            onClick={runFullDiagnostic}
            disabled={!userAEmail || !userBEmail || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Run Full Diagnostic
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((res, idx) => (
            <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-start gap-2 mb-2">
                {getStatusIcon(res.result || { error: res.error })}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{res.label}</p>
                  <p className="text-xs text-gray-500">{res.timestamp}</p>
                </div>
              </div>
              
              {res.error ? (
                <p className="text-red-600 text-xs mt-1">{res.error}</p>
              ) : res.result?.diagnostic ? (
                <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify(res.result.diagnostic, null, 2)}
                </pre>
              ) : res.result?.success === false ? (
                <p className="text-yellow-600 text-xs mt-1">{res.result.reason}</p>
              ) : (
                <p className="text-green-600 text-xs mt-1">✓ {res.result?.message}</p>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
          <p className="text-sm font-medium mb-2">📋 How to test:</p>
          <ol className="text-xs space-y-1 list-decimal list-inside">
            <li>Enter emails of two test users</li>
            <li>Ensure User A sent invite to User B</li>
            <li>Ensure User B accepted the invite</li>
            <li>User A sends a test message</li>
            <li>Run "Full Diagnostic" to verify everything</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}