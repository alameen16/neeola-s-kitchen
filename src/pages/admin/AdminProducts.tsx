import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, Search, X, Save, Loader2, Package, Upload, Image } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';

const CATEGORIES = ['Cookware', 'Appliances', 'Utensils', 'Storage'];
const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Vegan', 'Quick Meals', 'Grilling', 'Baking', 'Soups', 'Salads'];
const BADGES = ['', 'Best Seller', 'New', 'Premium'];

const emptyForm = {
  name: '', price: '', original_price: '', image: '', category: 'Cookware',
  badge: '', description: '', rating: '4.5', reviews: '0',
  in_stock: true, meal_category: [] as string[],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setImagePreview('');
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setForm({
      name: product.name ?? '',
      price: String(product.price ?? ''),
      original_price: product.original_price ? String(product.original_price) : '',
      image: product.image ?? '',
      category: product.category ?? 'Cookware',
      badge: product.badge ?? '',
      description: product.description ?? '',
      rating: String(product.rating ?? '4.5'),
      reviews: String(product.reviews ?? '0'),
      in_stock: product.in_stock ?? true,
      meal_category: product.meal_category ?? [],
    });
    setImagePreview(product.image ?? '');
    setEditingId(product.id);
    setShowForm(true);
  };

  // ── Upload image to Supabase Storage ──────────────────────────────────────
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    setForm(p => ({ ...p, image: publicUrl }));
    setImagePreview(publicUrl);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    // Upload to Supabase
    handleImageUpload(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.image) return;
    setSaving(true);

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image: form.image,
      category: form.category,
      badge: form.badge || null,
      description: form.description,
      rating: parseFloat(form.rating),
      reviews: parseInt(form.reviews),
      in_stock: form.in_stock,
      meal_category: form.meal_category,
    };

    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
    } else {
      await supabase.from('products').insert(payload);
    }

    await fetchProducts();
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setDeleting(id);
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  const toggleMealCategory = (mc: string) => {
    setForm(prev => ({
      ...prev,
      meal_category: prev.meal_category.includes(mc)
        ? prev.meal_category.filter(c => c !== mc)
        : [...prev.meal_category, mc],
    }));
  };

  const filtered = products.filter(p =>
    search === '' || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Products</h1>
          <p className="text-muted-foreground text-sm">{products.length} products in store</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <motion.div key={product.id} layout className="bg-card border border-border rounded-2xl overflow-hidden group">
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {product.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                    {product.badge}
                  </span>
                )}
                {!product.in_stock && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                    Out of stock
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-primary mb-1">{product.category}</p>
                <p className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">£{product.price}</span>
                    {product.original_price && (
                      <span className="text-xs text-muted-foreground line-through">£{product.original_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                      {deleting === product.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                        : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 top-8 bottom-8 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl bg-background border border-border rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <h2 className="font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Cast Iron Skillet"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>

                {/* Price + Original price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price (£) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="49.99"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original price (£)</label>
                    <input type="number" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))}
                      placeholder="79.99"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>

                {/* Image upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product image *</label>

                  {/* Upload area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium">
                            <Upload className="w-3.5 h-3.5" /> Change image
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                          <Image className="w-8 h-8 opacity-40" />
                        )}
                        <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</p>
                        <p className="text-xs">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* OR paste URL */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or paste URL</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <input
                    value={form.image}
                    onChange={e => {
                      setForm(p => ({ ...p, image: e.target.value }));
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Category + Badge */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badge</label>
                    <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors">
                      {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Short product description…"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                </div>

                {/* Rating + Reviews */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating (0-5)</label>
                    <input type="number" min="0" max="5" step="0.1" value={form.rating}
                      onChange={e => setForm(p => ({ ...p, rating: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reviews count</label>
                    <input type="number" value={form.reviews}
                      onChange={e => setForm(p => ({ ...p, reviews: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>

                {/* In stock toggle */}
                <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                  <span className="text-sm font-medium">In stock</span>
                  <button
                    onClick={() => setForm(p => ({ ...p, in_stock: !p.in_stock }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${form.in_stock ? 'bg-primary' : 'bg-border'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.in_stock ? 'translate-x-4' : ''}`} />
                  </button>
                </div>

                {/* Meal categories */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meal categories</label>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_CATEGORIES.map(mc => (
                      <button key={mc} onClick={() => toggleMealCategory(mc)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                          ${form.meal_category.includes(mc) ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary text-muted-foreground'}`}>
                        {mc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || uploading || !form.name || !form.price || !form.image}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><Save className="w-4 h-4" /> Save Product</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}