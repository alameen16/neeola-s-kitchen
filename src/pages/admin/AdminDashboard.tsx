import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Package, Mail, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalSubscribers: number;
  pendingOrders: number;
  recentOrders: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  pending_payment: { label: 'Awaiting Payment', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', icon: AlertCircle },
  shipped: { label: 'Shipped', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20', icon: Package },
  delivered: { label: 'Delivered', color: 'text-green-500 bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-500 bg-red-50 dark:bg-red-900/20', icon: XCircle },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, totalRevenue: 0, totalProducts: 0,
    totalSubscribers: 0, pendingOrders: 0, recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, products, subscribers] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('subscribers').select('id', { count: 'exact' }),
      ]);

      const allOrders = orders.data ?? [];
      const revenue = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
      const pending = allOrders.filter(o => o.status === 'pending' || o.status === 'pending_payment').length;

      setStats({
        totalOrders: allOrders.length,
        totalRevenue: revenue,
        totalProducts: products.count ?? 0,
        totalSubscribers: subscribers.count ?? 0,
        pendingOrders: pending,
        recentOrders: allOrders.slice(0, 5),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Revenue', value: `£${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Subscribers', value: stats.totalSubscribers, icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending orders alert */}
      {stats.pendingOrders > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You have <strong>{stats.pendingOrders}</strong> order{stats.pendingOrders !== 1 ? 's' : ''} waiting for action.
          </p>
        </motion.div>
      )}

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold">Recent Orders</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.recentOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recentOrders.map((order) => {
              const cfg = statusConfig[order.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/50 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="font-bold text-sm">£{order.total?.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
