import { useState, useEffect, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../app/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading');

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('denied'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setStatus(profile?.role === 'admin' ? 'admin' : 'denied');
    };
    check();
  }, []);

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (status === 'denied') return <Navigate to="/login" replace />;

  return <>{children}</>;
}
