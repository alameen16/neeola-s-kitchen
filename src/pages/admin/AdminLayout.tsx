import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChefHat, LayoutDashboard, ShoppingBag, Package,
  Mail, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../app/lib/supabaseClient';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/subscribers', label: 'Subscribers', icon: Mail },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminEmail(data.user?.email ?? '');
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-30 flex flex-col lg:translate-x-0 lg:static lg:flex"
        style={{ transform: undefined }}
      >
        <div className="hidden lg:flex flex-col h-full">
          <SidebarContent adminEmail={adminEmail} onLogout={handleLogout} />
        </div>
        <div className="flex flex-col h-full lg:hidden">
          <SidebarContent adminEmail={adminEmail} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
        </div>
      </motion.aside>

      {/* Static sidebar for desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border shrink-0">
        <SidebarContent adminEmail={adminEmail} onLogout={handleLogout} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Admin</span>
          </div>
        </div>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ adminEmail, onLogout, onClose }: {
  adminEmail: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Neeola's Kitchen</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4" />
              {label}
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="px-3 py-2 bg-secondary rounded-xl">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-xs font-semibold truncate">{adminEmail}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
