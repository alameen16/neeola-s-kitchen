import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Auth
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Components
import { KitchenNavbar } from './components/KitchenNavbar';
import { KitchenHero } from './components/KitchenHero';
import { FeaturedProducts } from './components/FeaturedProducts';
import { Newsletter } from './components/Newsletter';
import { KitchenFooter } from './components/KitchenFooter';
import { Cart } from './components/Cart';
import { SavedDrawer } from './components/SavedDrawer';

// Pages
import CheckoutPage from '../pages/CheckoutPage';
import AuthPage from '../pages/AuthPage';

// ── CartItem type ────────────────────────────────────────────────────────────
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  type?: 'product' | 'subscription';
  billingCycle?: 'weekly' | 'monthly';
}

// ── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeMealCategory, setActiveMealCategory] = useState('All');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isSavedOpen, setIsSavedOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity === 0) { removeFromCart(id); return; }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const checkoutItems = cartItems.map((item) => ({
    id: String(item.id),
    name: item.name,
    description: '',
    price: Math.round(item.price * 100),
    quantity: item.quantity,
    emoji: '🍽️',
    type: item.type ?? 'product' as const,
    billingCycle: item.billingCycle,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <KitchenNavbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        savedCount={favorites.length}
        onSavedClick={() => setIsSavedOpen(true)}
        activeMealCategory={activeMealCategory}
        setActiveMealCategory={(cat) => {
          setActiveMealCategory(cat);
          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      <main>
        <KitchenHero />
        <FeaturedProducts
          addToCart={addToCart}
          activeMealCategory={activeMealCategory}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
        <Newsletter />
      </main>
      <KitchenFooter />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        checkoutItems={checkoutItems}
      />

      <SavedDrawer
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedIds={favorites}
        addToCart={addToCart}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Checkout is protected — must be logged in to access */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}