'use client';

// app/admin/page.tsx - Tenant Management Panel
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useTenant } from '@/context/TenantContext';
import { tenantsAPI, Tenant, PricingPlan } from '@/lib/api/tenants';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { adminKey, refreshTenants, logout } = useTenant();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pricing, setPricing] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state for new tenant
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    plan: 'starter',
    region: 'latam',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsData, pricingData] = await Promise.all([
        tenantsAPI.getAll(),
        tenantsAPI.getPricing(),
      ]);
      setTenants(tenantsData.tenants || []);
      setPricing(pricingData.plans || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!adminKey || !newTenant.name || !newTenant.email) return;
    
    setActionLoading('create');
    try {
      await tenantsAPI.create(newTenant, adminKey);
      await loadData();
      await refreshTenants();
      setShowCreateModal(false);
      setNewTenant({ name: '', email: '', plan: 'starter', region: 'latam' });
    } catch (error) {
      console.error('Error creating tenant:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    if (!adminKey || !confirm(`Suspend tenant ${tenantId}?`)) return;
    
    setActionLoading(tenantId);
    try {
      await tenantsAPI.suspend(tenantId, adminKey);
      await loadData();
      await refreshTenants();
    } catch (error) {
      console.error('Error suspending tenant:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (tenantId: string) => {
    if (!adminKey) return;
    
    setActionLoading(tenantId);
    try {
      await tenantsAPI.activate(tenantId, adminKey);
      await loadData();
      await refreshTenants();
    } catch (error) {
      console.error('Error activating tenant:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getPlanColor = (plan: string) => {
    if (plan === 'enterprise') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (plan === 'professional') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-80">
        <Header
          title="⚙️ Admin Panel"
          subtitle="Tenant Management • Enterprise Control"
        />

        <div className="p-8">
          {/* Admin Status Bar */}
          <div className="glass rounded-2xl p-4 mb-8 flex items-center justify-between border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <div className="font-bold text-yellow-400">Admin Mode Active</div>
                <div className="text-xs text-gray-400">Full management access enabled</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
            >
              🚪 Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono gradient-text">{tenants.length}</div>
              <div className="text-sm text-gray-400 mt-2">Total Tenants</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-green-400">
                {tenants.filter(t => t.status === 'active').length}
              </div>
              <div className="text-sm text-gray-400 mt-2">Active</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-yellow-400">
                {tenants.filter(t => t.plan === 'enterprise').length}
              </div>
              <div className="text-sm text-gray-400 mt-2">Enterprise</div>
            </div>
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {tenants.reduce((sum, t) => sum + (t.decisions_this_month || 0), 0)}
              </div>
              <div className="text-sm text-gray-400 mt-2">Decisions/Month</div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="glass rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-glass-border flex justify-between items-center">
              <h2 className="text-xl font-bold">👥 Tenant Management</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-bold hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                + Create Tenant
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading tenants...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-glass-bg/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Tenant ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Decisions</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {tenants.map((tenant) => (
                    <tr key={tenant.tenant_id} className="hover:bg-glass-bg/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-cyan-400">{tenant.tenant_id}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">{tenant.name}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getPlanColor(tenant.plan))}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          tenant.status === 'active' 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        )}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">{tenant.decisions_this_month || 0}</td>
                      <td className="px-6 py-4">
                        {tenant.status === 'active' ? (
                          <button
                            onClick={() => handleSuspend(tenant.tenant_id)}
                            disabled={actionLoading === tenant.tenant_id}
                            className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm disabled:opacity-50"
                          >
                            {actionLoading === tenant.tenant_id ? '...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(tenant.tenant_id)}
                            disabled={actionLoading === tenant.tenant_id}
                            className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 text-sm disabled:opacity-50"
                          >
                            {actionLoading === tenant.tenant_id ? '...' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pricing Plans */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">💰 Pricing Plans</h2>
            <div className="grid grid-cols-3 gap-6">
              {pricing.map((plan) => (
                <div key={plan.id} className={cn(
                  "rounded-xl p-6 border",
                  plan.id === 'enterprise' 
                    ? "bg-yellow-500/10 border-yellow-500/30" 
                    : "bg-glass-bg border-glass-border"
                )}>
                  <div className="text-lg font-bold mb-2">{plan.name}</div>
                  <div className="text-3xl font-bold font-mono mb-4">
                    ${plan.price.toLocaleString()}
                    <span className="text-sm text-gray-400 font-normal">/mes</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {plan.decisions === -1 ? 'Unlimited' : plan.decisions} decisions/month
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="glass rounded-2xl p-8 w-full max-w-md border border-glass-border">
              <h2 className="text-xl font-bold mb-6">➕ Create New Tenant</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    placeholder="admin@acme.com"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Plan</label>
                    <select
                      value={newTenant.plan}
                      onChange={(e) => setNewTenant({...newTenant, plan: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    >
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Region</label>
                    <select
                      value={newTenant.region}
                      onChange={(e) => setNewTenant({...newTenant, region: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-black/50 border border-glass-border focus:border-cyan-500 outline-none text-white"
                    >
                      <option value="latam">LATAM</option>
                      <option value="usa">USA</option>
                      <option value="europe">Europe</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-lg bg-glass-bg border border-glass-border hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTenant}
                  disabled={actionLoading === 'create' || !newTenant.name || !newTenant.email}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-bold disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

