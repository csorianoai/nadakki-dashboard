'use client';

// app/admin/layout.tsx - Admin Protection Layer
import { useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, validateAdminKey } = useTenant();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  const handleValidate = async () => {
    setValidating(true);
    setError('');
    
    const isValid = await validateAdminKey(inputKey);
    
    if (!isValid) {
      setError('Invalid admin key');
    }
    
    setValidating(false);
  };

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-quantum-void">
      <div className="glass rounded-2xl p-8 w-full max-w-md border border-glass-border">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-4xl mb-4">
            🔐
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-gray-400">Enter your admin key to access this section</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Admin Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
              placeholder="Enter admin key..."
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-glass-bg border",
                error ? "border-red-500" : "border-glass-border",
                "focus:border-cyan-500 outline-none",
                "font-mono"
              )}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            onClick={handleValidate}
            disabled={validating || !inputKey}
            className={cn(
              "w-full py-3 rounded-lg font-bold transition-all",
              "bg-gradient-to-r from-yellow-500 to-orange-600",
              "hover:from-yellow-400 hover:to-orange-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {validating ? 'Validating...' : 'Access Admin Panel'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Contact your system administrator if you need access
        </p>
      </div>
    </div>
  );
}
