import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, Clock, CheckCircle, XCircle,
  Package, Search, ChevronDown, Truck, CreditCard, Loader2,
} from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ORDER as string;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string;

const STATUS_FLOW = [
  { key: 'pending_payment', label: 'Awaiting Payment', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  { key: 'processing', label: 'Processing', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
];

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'Great news! Your payment has been confirmed and your order is now being processed.',
  processing: 'Your order is currently being prepared and packed with care.',
  shipped: 'Your order is on its way! It should arrive within the expected delivery window.',
  delivered: "Your order has been delivered! We hope you enjoy your purchase from Neeola's Kitchen.",
  cancelled: 'Your order has been cancelled. Please contact us if you have any questions.',
};

const getStatusConfig = (key: string) => STATUS_FLOW.find(s => s.key === key) ?? STATUS_FLOW[0];

const sendStatusEmail = async (order: any, newStatus: string) => {
  const cfg = getStatusConfig(newStatus);
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      order_id: order.order_reference ?? order.id,
      order_status: cfg.label,
      status_message: STATUS_MESSAGES[newStatus] ?? '',
    }, EMAILJS_PUBLIC_KEY);
  } catch (err) {
    console.error('Email error:', err);
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  const updateStatus = async (order: any, newStatus: string) => {
    setUpdating(order.id + newStatus);
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    await sendStatusEmail(order, newStatus);
    setUpdating(null);
  };

  const filtered = orders.filter(o => {
    const matchesSearch = search === '' ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Orders</h1>
        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterStatus === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
          All ({orders.length})
        </button>
        {STATUS_FLOW.map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterStatus === s.key ? `${s.bg} ${s.color} ${s.border}` : 'border-border text-muted-foreground hover:border-primary'}`}>
            {s.label} ({orders.filter(o => o.status === s.key).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, order reference…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>

      {/* Orders list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => {
              const cfg = getStatusConfig(order.status);
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === order.id;
              const items = Array.isArray(order.items) ? order.items : [];
              const currentIndex = STATUS_FLOW.findIndex(s => s.key === order.status);

              return (
                <div key={order.id}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm">{order.customer_name}</p>
                        {order.order_reference && (
                          <span className="text-xs font-mono text-muted-foreground">{order.order_reference}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                      <span className="font-bold text-sm">£{Number(order.total).toFixed(2)}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border bg-secondary/20">
                        <div className="px-6 py-5 space-y-5">

                          {/* Items */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Items ordered</p>
                            <div className="space-y-1.5">
                              {items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                  <span className="font-medium">£{((item.price * item.quantity) / 100).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                                <span>Total</span>
                                <span>£{Number(order.total).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status flow progress */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Order status</p>

                            {/* Visual progress */}
                            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                              {STATUS_FLOW.filter(s => s.key !== 'cancelled').map((s, i, arr) => {
                                const sIndex = STATUS_FLOW.findIndex(st => st.key === s.key);
                                const isActive = order.status === s.key;
                                const isPast = currentIndex > sIndex && order.status !== 'cancelled';
                                const SIcon = s.icon;
                                return (
                                  <div key={s.key} className="flex items-center gap-1 shrink-0">
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all
                                      ${isActive ? `${s.bg} ${s.color} ${s.border} ring-2 ring-offset-1` : isPast ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border'}`}>
                                      <SIcon className="w-3 h-3" />
                                      <span className="hidden md:inline">{s.label}</span>
                                    </div>
                                    {i < arr.length - 1 && <div className={`w-4 h-0.5 shrink-0 ${isPast ? 'bg-primary' : 'bg-border'}`} />}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Status buttons */}
                            <div className="flex flex-wrap gap-2">
                              {STATUS_FLOW.map(s => {
                                const isCurrentStatus = order.status === s.key;
                                const isUpdating = updating === order.id + s.key;
                                const SIcon = s.icon;
                                return (
                                  <button key={s.key}
                                    onClick={() => !isCurrentStatus && !updating && updateStatus(order, s.key)}
                                    disabled={isCurrentStatus || !!updating}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                                      ${isCurrentStatus ? `${s.bg} ${s.color} ${s.border}` : 'border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
                                    {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <SIcon className="w-3 h-3" />}
                                    {isCurrentStatus ? `✓ ${s.label}` : s.label}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Customer receives an email on every status update.</p>
                          </div>

                          {order.stripe_payment_id && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Payment ID</p>
                              <p className="text-xs font-mono text-muted-foreground">{order.stripe_payment_id}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}