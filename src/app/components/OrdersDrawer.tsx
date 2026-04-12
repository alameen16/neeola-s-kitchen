import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Clock, CheckCircle, XCircle, Package, Truck, CreditCard, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

const STATUS_FLOW = [
  { key: 'pending_payment', label: 'Awaiting Payment', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', description: 'Waiting for payment confirmation' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', description: 'Payment received, order confirmed' },
  { key: 'processing', label: 'Processing', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', description: 'Your order is being prepared' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', description: 'Your order is on its way' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', description: 'Order delivered successfully' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', description: 'This order was cancelled' },
];

const getStatusConfig = (key: string) => STATUS_FLOW.find(s => s.key === key) ?? STATUS_FLOW[0];

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrdersDrawer({ isOpen, onClose }: OrdersDrawerProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    fetchOrders();

    // Realtime subscription — updates status live without refresh
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_email=eq.${user.email}`,
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">My Orders</h2>
                {orders.length > 0 && (
                  <span className="text-sm text-muted-foreground">({orders.length})</span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-6">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-30" />
                  <div>
                    <p className="font-semibold">Sign in to view orders</p>
                    <p className="text-sm text-muted-foreground mt-1">Your order history will appear here</p>
                  </div>
                </div>
              ) : loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse space-y-3">
                      <div className="h-4 bg-secondary rounded w-1/2" />
                      <div className="h-3 bg-secondary rounded w-1/3" />
                      <div className="h-8 bg-secondary rounded" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-6">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-30" />
                  <div>
                    <p className="font-semibold">No orders yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Your orders will appear here once you place one</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {orders.map(order => {
                    const cfg = getStatusConfig(order.status);
                    const StatusIcon = cfg.icon;
                    const isExpanded = expandedId === order.id;
                    const items = Array.isArray(order.items) ? order.items : [];
                    const currentIndex = STATUS_FLOW.findIndex(s => s.key === order.status);
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                        {/* Order summary */}
                        <div className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {order.order_reference && (
                                  <span className="text-xs font-mono font-bold text-primary">{order.order_reference}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-sm font-semibold">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                              <p className="text-sm font-bold text-primary mt-0.5">£{Number(order.total).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-border"
                            >
                              <div className="p-4 space-y-4">

                                {/* Status progress tracker */}
                                {!isCancelled && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Order progress</p>
                                    <div className="space-y-2">
                                      {STATUS_FLOW.filter(s => s.key !== 'cancelled').map((s, i) => {
                                        const sIndex = STATUS_FLOW.findIndex(st => st.key === s.key);
                                        const isActive = order.status === s.key;
                                        const isPast = currentIndex > sIndex;
                                        const SIcon = s.icon;
                                        return (
                                          <div key={s.key} className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${isActive ? `${s.bg} ${s.color} ${s.border}` : isPast ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                                              <SIcon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1">
                                              <p className={`text-xs font-semibold ${isActive ? s.color : isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {s.label}
                                                {isActive && <span className="ml-1.5 text-[10px] font-normal opacity-70">← current</span>}
                                              </p>
                                              {isActive && <p className="text-[11px] text-muted-foreground">{s.description}</p>}
                                            </div>
                                            {isPast && <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {isCancelled && (
                                  <div className={`flex items-center gap-2 p-3 rounded-xl ${cfg.bg} ${cfg.border} border`}>
                                    <XCircle className={`w-4 h-4 ${cfg.color} shrink-0`} />
                                    <p className="text-xs text-red-600 dark:text-red-400">This order was cancelled. Contact us if you have questions.</p>
                                  </div>
                                )}

                                {/* Items list */}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Items</p>
                                  <div className="space-y-1.5">
                                    {items.map((item: any, i: number) => (
                                      <div key={i} className="flex justify-between text-sm">
                                        <span className="text-foreground/80">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                        <span className="font-medium">£{((item.price * item.quantity) / 100).toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                                      <span>Total paid</span>
                                      <span>£{Number(order.total).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
