import { useState, useEffect } from 'react';
import { Mail, Search, Trash2, Loader2, Download } from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchSubscribers(); }, []);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    setSubscribers(data ?? []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    setDeleting(id);
    await supabase.from('subscribers').delete().eq('id', id);
    setSubscribers(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  };

  const exportCSV = () => {
    const csv = ['Email,Date Subscribed',
      ...subscribers.map(s => `${s.email},${new Date(s.created_at).toLocaleDateString('en-GB')}`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'subscribers.csv';
    a.click();
  };

  const filtered = subscribers.filter(s =>
    search === '' || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Subscribers</h1>
          <p className="text-muted-foreground text-sm">{subscribers.length} newsletter subscribers</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Subscribers list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No subscribers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sub.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Subscribed {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(sub.id)}
                  disabled={deleting === sub.id}
                  className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  {deleting === sub.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                    : <Trash2 className="w-4 h-4 text-destructive" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
