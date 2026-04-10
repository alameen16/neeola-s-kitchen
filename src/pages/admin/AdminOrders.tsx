import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle, XCircle, AlertCircle, Package, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';

const STATUSES = ['pending', 'pending_payment', 'shipped', 'delivered', 'cancelled'];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  pending_payment: { label: 'Awaiting Payment', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', icon: AlertCircle },
  shipped: { label: 'Shipped', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', icon: Package },
  delivered: { label: 'Delivered', color: 'text-green-500 bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setUpdating(null);
  };

  const filtered = orders.filter(o => {
    const matchesSearch = search === '' ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.stripe_payment_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Orders</h1>
        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => {
              const cfg = statusConfig[order.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === order.id;
              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div key={order.id}>
                  {/* Order row */}
                  <div
                    className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="font-bold text-sm">£{order.total?.toFixed(2)}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded order details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-5 bg-secondary/30 border-t border-border"
                    >
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Items */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Items</p>
                          <div className="space-y-1.5">
                            {items.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                <span className="font-medium">£{((item.price * item.quantity) / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Update status */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Update status</p>
                          <div className="flex flex-wrap gap-2">
                            {STATUSES.map(s => {
                              const sCfg = statusConfig[s];
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  disabled={order.status === s || updating === order.id}
                                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                    ${order.status === s ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary hover:text-primary'}`}
                                >
                                  {sCfg.label}
                                </button>
                              );
                            })}
                          </div>
                          {order.stripe_payment_id && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Stripe ID: <span className="font-mono">{order.stripe_payment_id}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
