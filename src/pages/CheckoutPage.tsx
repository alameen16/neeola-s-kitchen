/// <reference types="vite/client" />

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  ChefHat, Lock, Truck, Tag, X, CheckCircle, Loader2,
  CreditCard, Landmark, ChevronRight, MapPin, Calendar,
  User, Mail, Phone, Download, Package, Clock, Shield,
  ArrowLeft, Repeat, Star, AlertCircle, Copy, Check,
} from 'lucide-react';
import { useAuth } from '../app/lib/AuthContext';
import { supabase } from '../app/lib/supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

// ── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  emoji: string;
  type: 'product' | 'subscription';
  billingCycle?: 'weekly' | 'monthly';
}

interface DeliveryForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  county: string;
  postcode: string;
  notes: string;
  deliveryDate: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (pence: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);

const getDeliveryDates = () => {
  const dates: { value: string; label: string; fee: number }[] = [];
  const now = new Date();
  for (let i = 2; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    dates.push({ value, label, fee: i <= 3 ? 499 : 0 });
  }
  return dates;
};

const generateOrderId = () => 'NK-' + Math.floor(100000 + Math.random() * 900000);

function calcTotals(items: CartItem[], promoDiscount: number, expressFee: number) {
  const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const ship = (sub > 5000 ? 0 : 399) + expressFee;
  const vat = Math.round(sub * 0.2);
  const disc = Math.round(sub * (promoDiscount / 100));
  return { sub, ship, vat, disc, total: sub + ship + vat - disc };
}

const VALID_PROMOS: Record<string, { label: string; pct: number }> = {
  WELCOME10: { label: 'Welcome discount', pct: 10 },
  KITCHEN15: { label: 'Kitchen special', pct: 15 },
  SUMMER20: { label: 'Summer offer', pct: 20 },
};

// ── Bank details ─────────────────────────────────────────────────────────────
const BANK_DETAILS = [
  { label: 'Account name', value: "Neeola's Kitchen Ltd" },
  { label: 'Sort code', value: '00-00-00' },
  { label: 'Account no.', value: '00000000' },
  { label: 'Bank', value: 'Barclays Bank' },
];

// ── Copy to clipboard button ─────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-secondary rounded transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-foreground/40" />}
    </button>
  );
}

// ── StepBar ──────────────────────────────────────────────────────────────────
function StepBar({ current, maxReached }: { current: number; maxReached: number }) {
  const steps = ['Delivery', 'Payment', 'Review'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${active ? 'text-primary' : done ? 'text-foreground/70' : 'text-foreground/30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${active ? 'bg-primary text-white' : done ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground/30'}`}>
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : idx}
              </div>
              <span className={idx <= maxReached ? '' : 'opacity-40'}>{label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-foreground/20" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Address autocomplete ─────────────────────────────────────────────────────
function AddressAutocomplete({ value, onChange, onSelect }: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: { line1: string; city: string; county: string; postcode: string }) => void;
}) {
  const [suggestions, setSuggestions] = useState<{ description: string; place_id: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) { setSuggestions([]); setOpen(false); return; }
    setSuggestions([
      { description: `${query}, Portsmouth, Hampshire, PO1 2AB`, place_id: 'mock1' },
      { description: `${query}, Southampton, Hampshire, SO14 3LP`, place_id: 'mock2' },
      { description: `${query}, London, Greater London, EC1A 1BB`, place_id: 'mock3' },
    ]);
    setOpen(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(value), 300);
    return () => clearTimeout(t);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSelect = (desc: string) => {
    const parts = desc.split(', ');
    onSelect({ line1: parts[0] || '', city: parts[1] || '', county: parts[2] || '', postcode: parts[3] || '' });
    onChange(parts[0] || desc);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="Start typing your address…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
      </div>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-20 top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {suggestions.map(s => (
              <li key={s.place_id} onClick={() => handleSelect(s.description)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary cursor-pointer border-b border-border last:border-0">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {s.description}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Subscription summary ─────────────────────────────────────────────────────
function SubscriptionSummary({ items }: { items: CartItem[] }) {
  const subs = items.filter(i => i.type === 'subscription');
  if (!subs.length) return null;
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Repeat className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Subscription details</span>
      </div>
      {subs.map(sub => (
        <div key={sub.id} className="space-y-1.5 text-sm">
          <p className="font-medium">{sub.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Billed {sub.billingCycle ?? 'weekly'}</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {fmt(sub.price)} / {sub.billingCycle ?? 'week'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── VAT invoice download ─────────────────────────────────────────────────────
function downloadVATInvoice(orderId: string, delivery: DeliveryForm, items: CartItem[], totals: ReturnType<typeof calcTotals>) {
  const lines = items.map(i =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${i.name} ×${i.quantity}</td>
     <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(i.price * i.quantity)}</td></tr>`
  ).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;color:#1C1714;font-size:14px}
  h1{font-size:28px;margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}
  th{text-align:left;padding:10px 12px;background:#f5f0eb;font-size:12px;text-transform:uppercase}
  .row{display:flex;justify-content:space-between;margin-bottom:6px}</style></head><body>
  <h1>Neeola's Kitchen</h1><h2 style="color:#666;font-weight:normal">VAT Invoice</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px">
    <div><p style="color:#888;font-size:12px">INVOICE TO</p>
    <p><strong>${delivery.firstName} ${delivery.lastName}</strong><br>${delivery.line1}<br>${delivery.city}, ${delivery.postcode}<br>${delivery.email}</p></div>
    <div style="text-align:right"><p style="color:#888;font-size:12px">INVOICE DETAILS</p>
    <p><strong>Invoice #:</strong> ${orderId}<br><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p></div>
  </div>
  <table><thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lines}</tbody></table>
  <div style="text-align:right;max-width:300px;margin-left:auto">
    <div class="row"><span>Subtotal (excl. VAT)</span><span>${fmt(totals.sub - totals.vat)}</span></div>
    <div class="row"><span>VAT (20%)</span><span>${fmt(totals.vat)}</span></div>
    <div class="row"><span>Shipping</span><span>${totals.ship === 0 ? 'Free' : fmt(totals.ship)}</span></div>
    ${totals.disc > 0 ? `<div class="row" style="color:green"><span>Discount</span><span>−${fmt(totals.disc)}</span></div>` : ''}
    <div class="row" style="font-size:18px;font-weight:bold;border-top:2px solid #1C1714;padding-top:8px;margin-top:8px">
    <span>Total</span><span>${fmt(totals.total)}</span></div>
  </div></body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  a.download = `invoice-${orderId}.html`;
  a.click();
}

// ── Main checkout form ───────────────────────────────────────────────────────
function CheckoutForm({ cartItems }: { cartItems: CartItem[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const fullName = user?.user_metadata?.full_name ?? '';

  const [delivery, setDelivery] = useState<DeliveryForm>({
    firstName: fullName.split(' ')[0] ?? '',
    lastName: fullName.split(' ').slice(1).join(' ') ?? '',
    email: user?.email ?? '',
    phone: '', line1: '', city: '', county: '', postcode: '', notes: '', deliveryDate: '',
  });

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [payMethod, setPayMethod] = useState<'card' | 'bank'>('card');
  const [cardName, setCardName] = useState(fullName);
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [stripeError, setStripeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [done, setDone] = useState(false);

  const promoDiscount = VALID_PROMOS[promoCode]?.pct ?? 0;
  const expressFee = getDeliveryDates().find(d => d.value === delivery.deliveryDate)?.fee ?? 0;
  const totals = calcTotals(cartItems, promoDiscount, expressFee);
  const setField = (k: keyof DeliveryForm) => (v: string) => setDelivery(p => ({ ...p, [k]: v }));

  const goStep = (n: number) => {
    setStep(n);
    setMaxReached(m => Math.max(m, n));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (VALID_PROMOS[code]) { setPromoCode(code); setPromoError(''); }
    else { setPromoError('Invalid code. Try WELCOME10'); setTimeout(() => setPromoError(''), 3000); }
  };

  // ── Save order to Supabase ────────────────────────────────────────────────
  const saveOrder = async (stripePaymentId: string, status: string) => {
    const { error } = await supabase.from('orders').insert({
      customer_name: `${delivery.firstName} ${delivery.lastName}`,
      customer_email: delivery.email,
      items: cartItems.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total: totals.total / 100,
      status,
      stripe_payment_id: stripePaymentId,
    });
    if (error) console.error('Order save error:', error);
  };

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    setLoading(true);
    setStripeError('');
    const id = generateOrderId();

    try {
      // ── Bank transfer flow ───────────────────────────────────────────────
      if (payMethod === 'bank') {
        await saveOrder('', 'pending_payment');
        setOrderId(id);
        setDone(true);
        return;
      }

      // ── Card payment flow ────────────────────────────────────────────────
      if (!stripe || !elements) return;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setStripeError('Card details not found. Please go back to the payment step.');
        return;
      }

      // Step 1 — Create payment intent via edge function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ amount: totals.total }),
        }
      );

      const { clientSecret, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);

      // Step 2 — Confirm card payment
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: cardName, email: delivery.email },
        },
      });

      if (stripeErr) {
        setStripeError(stripeErr.message ?? 'Payment failed');
        return;
      }

      // Step 3 — Save order to Supabase
      await saveOrder(paymentIntent?.id ?? '', 'pending');
      setOrderId(id);
      setDone(true);

    } catch (err: any) {
      setStripeError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-background border border-border rounded-2xl p-8 text-center shadow-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Order placed!</h2>

        {/* Bank transfer pending notice */}
        {payMethod === 'bank' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">⚠️ Payment pending</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
              Your order is reserved. Please transfer <strong>{fmt(totals.total)}</strong> to the account below using your order reference as the payment reference.
            </p>
            <div className="space-y-2">
              {BANK_DETAILS.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-amber-600 dark:text-amber-500">{label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">{value}</span>
                    <CopyButton text={value} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-amber-200 dark:border-amber-800 pt-2 mt-2">
                <span className="text-xs text-amber-600 dark:text-amber-500">Payment reference</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">{orderId}</span>
                  <CopyButton text={orderId} />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-amber-500 mt-3">Order confirmed once payment received (1–2 business days).</p>
          </div>
        )}

        <p className="text-foreground/60 text-sm mb-6">
          Confirmation sent to <strong>{delivery.email}</strong>.{' '}
          {payMethod === 'card' && <>Arrives <strong>{new Date(delivery.deliveryDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.</>}
        </p>

        <div className="bg-secondary rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Order reference</span>
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold">{orderId}</span>
              <CopyButton text={orderId} />
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Total {payMethod === 'bank' ? 'to transfer' : 'charged'}</span>
            <span className="font-bold">{fmt(totals.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground/60">Payment method</span>
            <span className="font-medium">{payMethod === 'card' ? 'Card' : 'Bank transfer'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => downloadVATInvoice(orderId, delivery, cartItems, totals)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" /> VAT Invoice
          </button>
          <button onClick={() => navigate('/')}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
            Back to kitchen
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg"><ChefHat className="w-5 h-5 text-white" /></div>
              <span className="font-bold text-lg">Neeola's Kitchen</span>
            </div>
            <span className="text-foreground/30">·</span>
            <span className="text-foreground/60 text-sm">Checkout</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-foreground/50">
            <Lock className="w-3 h-3" /> SSL secured by Stripe
          </div>
        </motion.div>

        {user && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
            </div>
            <span className="text-foreground/70">
              Signed in as <strong className="text-foreground">{user.user_metadata?.full_name ?? user.email}</strong>
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <StepBar current={step} maxReached={maxReached} />
            <AnimatePresence mode="wait">

              {/* Step 1: Delivery */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-xl font-bold">Delivery details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {(['firstName', 'lastName'] as const).map((k, i) => (
                      <div key={k} className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">{i === 0 ? 'First name' : 'Last name'}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                          <input value={delivery[k]} onChange={e => setField(k)(e.target.value)} required
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <input type="email" value={delivery.email} onChange={e => setField('email')(e.target.value)} required
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <p className="text-[11px] text-foreground/50 flex items-center gap-1"><Mail className="w-3 h-3" /> Confirmation sent here</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                      <input type="tel" value={delivery.phone} onChange={e => setField('phone')(e.target.value)} placeholder="+44 7700 900 000"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Street address</label>
                    <AddressAutocomplete value={delivery.line1} onChange={v => setField('line1')(v)}
                      onSelect={parts => setDelivery(p => ({ ...p, ...parts }))} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['city', 'county', 'postcode'] as const).map(k => (
                      <div key={k} className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">{k}</label>
                        <input value={delivery[k]} onChange={e => setField(k)(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Delivery date</label>
                    <div className="grid grid-cols-2 gap-2">
                      {getDeliveryDates().slice(0, 6).map(d => (
                        <button key={d.value} type="button" onClick={() => setField('deliveryDate')(d.value)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all
                            ${delivery.deliveryDate === d.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary text-foreground/70'}`}>
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${delivery.deliveryDate === d.value ? 'text-primary' : 'text-foreground/30'}`} />
                          <div>
                            <span className="font-medium">{d.label}</span>
                            {d.fee > 0
                              ? <span className="block text-[10px] text-orange-500 font-semibold">Express +{fmt(d.fee)}</span>
                              : <span className="block text-[10px] text-green-600 font-semibold">Free delivery</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">
                      Delivery notes <span className="normal-case font-normal text-foreground/40">(optional)</span>
                    </label>
                    <textarea value={delivery.notes} onChange={e => setField('notes')(e.target.value)} rows={2}
                      placeholder="Leave at door, ring bell…"
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>
                  <button onClick={() => goStep(2)}
                    disabled={!delivery.firstName || !delivery.email || !delivery.line1 || !delivery.postcode || !delivery.deliveryDate}
                    className="w-full py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-xl font-bold">Payment</h2>
                  <SubscriptionSummary items={cartItems} />
                  <div className="flex gap-3">
                    {(['card', 'bank'] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all
                          ${payMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground/60 hover:bg-secondary'}`}>
                        {m === 'card' ? <CreditCard className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                        {m === 'card' ? 'Card' : 'Bank transfer'}
                      </button>
                    ))}
                  </div>

                  {payMethod === 'card' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {['VISA', 'MC', 'AMEX', 'MAESTRO'].map(b => (
                          <div key={b} className="px-2.5 py-1 border border-border rounded text-[10px] font-bold text-foreground/50">{b}</div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Name on card</label>
                        <input value={cardName} onChange={e => setCardName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold tracking-wide uppercase text-foreground/60">Card details</label>
                        <div className="px-3 py-3 rounded-lg border border-border bg-background focus-within:border-primary transition-colors">
                          <CardElement options={{
                            style: {
                              base: { fontSize: '14px', color: '#1C1714', fontFamily: 'inherit', '::placeholder': { color: '#9ca3af' } },
                              invalid: { color: '#ef4444' },
                            },
                            hidePostalCode: true,
                          }} />
                        </div>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                        <Lock className="w-3 h-3" /> Secured by Stripe · 256-bit SSL · PCI DSS compliant
                      </p>
                    </div>
                  )}

                  {payMethod === 'bank' && (
                    <div className="space-y-3">
                      <div className="bg-secondary rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold">Bank transfer details</p>
                        {BANK_DETAILS.map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-sm text-foreground/60">{label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-sm">{value}</span>
                              <CopyButton text={value} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">How it works</p>
                        <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                          <li>Click "Place order" to reserve your items</li>
                          <li>Transfer the exact amount to the account above</li>
                          <li>Use your order reference as the payment reference</li>
                          <li>Your order ships once payment is received (1–2 business days)</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {stripeError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {stripeError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => goStep(1)} className="px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Back</button>
                    <button onClick={() => goStep(3)}
                      className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                      Review order <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-5">
                  <h2 className="text-xl font-bold">Review your order</h2>

                  <div className="bg-secondary rounded-xl p-4 text-sm space-y-1">
                    <p className="text-xs font-semibold tracking-wide uppercase text-foreground/50 mb-2">Delivering to</p>
                    <p className="font-semibold">{delivery.firstName} {delivery.lastName}</p>
                    <p className="text-foreground/70">{delivery.line1}, {delivery.city}, {delivery.postcode}</p>
                    <p className="text-foreground/70">{delivery.email}</p>
                    {delivery.deliveryDate && (
                      <p className="flex items-center gap-1.5 text-primary font-medium mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(delivery.deliveryDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {expressFee > 0 && <span className="text-orange-500 text-xs font-semibold">(Express)</span>}
                      </p>
                    )}
                  </div>

                  {/* Payment method summary */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl text-sm">
                    {payMethod === 'card'
                      ? <><CreditCard className="w-4 h-4 text-primary" /><span>Paying by <strong>card</strong></span></>
                      : <><Landmark className="w-4 h-4 text-amber-500" /><span>Paying by <strong>bank transfer</strong> — order reserved on placement</span></>
                    }
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide uppercase text-foreground/50">Items</p>
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <span>{item.emoji}</span>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-foreground/40">×{item.quantity}</span>
                        </div>
                        <span className="font-semibold">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    {[['Subtotal', fmt(totals.sub)], ['Shipping', totals.ship === 0 ? 'Free' : fmt(totals.ship)], ['VAT (20%)', fmt(totals.vat)]].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-foreground/60"><span>{k}</span><span>{v}</span></div>
                    ))}
                    {totals.disc > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>{VALID_PROMOS[promoCode]?.label} ({promoDiscount}%)</span><span>−{fmt(totals.disc)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                      <span>Total</span><span>{fmt(totals.total)}</span>
                    </div>
                  </div>

                  {/* Hidden CardElement to keep Stripe reference alive on step 3 */}
                  {payMethod === 'card' && (
                    <div className="hidden">
                      <CardElement />
                    </div>
                  )}

                  <AnimatePresence>
                    {stripeError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {stripeError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => goStep(2)} className="px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Back</button>
                    <button onClick={placeOrder} disabled={loading || (payMethod === 'card' && !stripe)}
                      className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</>
                        : payMethod === 'card'
                          ? <><Lock className="w-4 h-4" /> Place order · {fmt(totals.total)}</>
                          : <><Landmark className="w-4 h-4" /> Reserve order · {fmt(totals.total)}</>
                      }
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="sticky top-8 bg-background border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-foreground/50" />
                Your order ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
              </h3>
              <div className="space-y-3">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-lg shrink-0">{item.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-foreground/50">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{fmt(item.price * item.quantity)}</p>
                      <p className="text-xs text-foreground/40">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                {promoCode ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-green-600 font-medium"><Tag className="w-3.5 h-3.5" /> {promoCode} — {promoDiscount}% off</span>
                    <button onClick={() => { setPromoCode(''); setPromoInput(''); }} className="text-foreground/40 hover:text-foreground/60"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
                      <input value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        onKeyDown={e => e.key === 'Enter' && applyPromo()} placeholder="Promo code"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <button onClick={applyPromo} className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Apply</button>
                  </div>
                )}
                <AnimatePresence>
                  {promoError && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                      <AlertCircle className="w-3 h-3" /> {promoError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-foreground/60"><span>Subtotal</span><span>{fmt(totals.sub)}</span></div>
                <div className={`flex justify-between ${totals.ship === 0 ? 'text-green-600' : 'text-foreground/60'}`}>
                  <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                  <span>{totals.ship === 0 ? 'Free' : fmt(totals.ship)}</span>
                </div>
                <div className="flex justify-between text-foreground/60"><span>VAT (20%)</span><span>{fmt(totals.vat)}</span></div>
                {totals.disc > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{fmt(totals.disc)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span>{fmt(totals.total)}</span></div>
                <p className="text-[11px] text-foreground/40">Includes VAT · Free shipping on orders over £50</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                {[[<Lock className="w-3 h-3" />, 'SSL secure'], [<Shield className="w-3 h-3" />, 'Stripe PCI'], [<Truck className="w-3 h-3" />, 'Free >£50']].map(([icon, label], i) => (
                  <div key={i} className="flex items-center gap-1 text-[11px] text-foreground/40">{icon as React.ReactNode} {label as string}</div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const location = useLocation();
  const cartItems: CartItem[] = (location.state as { cartItems?: CartItem[] })?.cartItems ?? [];

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm cartItems={cartItems} />
    </Elements>
  );
}