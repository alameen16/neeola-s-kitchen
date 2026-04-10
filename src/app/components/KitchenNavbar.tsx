import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Sun, Moon, ChefHat, Heart, User, Search, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';

const mealCategories = [
  'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Vegan',
  'Quick Meals', 'Grilling', 'Baking', 'Soups', 'Salads',
];

interface KitchenNavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  cartCount: number;
  onCartClick: () => void;
  savedCount: number;
  onSavedClick: () => void;
  activeMealCategory: string;
  setActiveMealCategory: (category: string) => void;
}

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Recipes', href: '#recipes' },
  { name: 'Ingredients', href: '#ingredients' },
  { name: 'Kitchen Tools', href: '#tools' },
  { name: 'Meal Plans', href: '#meal-plans' },
  { name: 'Blog', href: '#blog' },
  { name: 'Deals', href: '#deals' },
];

const categoryStrip = ['All', ...mealCategories];

export function KitchenNavbar({
  darkMode,
  toggleDarkMode,
  cartCount,
  onCartClick,
  savedCount,
  onSavedClick,
  activeMealCategory,
  setActiveMealCategory,
}: KitchenNavbarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountClick = () => {
    if (user) {
      setProfileOpen((v) => !v);
    } else {
      navigate('/login');
    }
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    navigate('/');
  };

  const avatarLetter = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? '?';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      {/* ── Layer 1: Top Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="bg-primary p-2 rounded-lg">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Neeola's Kitchen</span>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`hidden md:flex items-center gap-2 flex-1 max-w-sm px-4 py-2 rounded-lg border transition-all duration-200 ${
              searchFocused
                ? 'border-primary bg-background shadow-sm'
                : 'border-border bg-secondary'
            }`}
          >
            <Search className="w-4 h-4 text-foreground/40 shrink-0" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, tools..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none w-full"
            />
          </motion.div>

          {/* Right Icons */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Saved */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              onClick={onSavedClick}
              className="hidden md:flex flex-col items-center gap-0.5 p-2 hover:bg-secondary rounded-lg transition-colors relative"
              aria-label="Saved items"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  savedCount > 0 ? 'fill-red-500 text-red-500' : ''
                }`}
              />
              <span className="text-[10px] text-foreground/60">Saved</span>
              {savedCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full"
                >
                  {savedCount}
                </motion.span>
              )}
            </motion.button>

            {/* Cart */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={onCartClick}
              className="flex flex-col items-center gap-0.5 p-2 hover:bg-secondary rounded-lg transition-colors relative"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden md:block text-[10px] text-foreground/60">Cart</span>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>

            {/* Account / Profile */}
            <div ref={profileRef} className="relative hidden md:block">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                onClick={handleAccountClick}
                className="flex flex-col items-center gap-0.5 p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Account"
              >
                {user ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {avatarLetter}
                    </div>
                    <span className="text-[10px] text-foreground/60">Account</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    <span className="text-[10px] text-foreground/60">Account</span>
                  </>
                )}
              </motion.button>

              {/* Profile dropdown */}
              <AnimatePresence>
                {profileOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-2xl shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-sm truncate">
                        {user.user_metadata?.full_name ?? 'My Account'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/account'); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Account Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-red-500"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark mode toggle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={toggleDarkMode}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Layer 2: Nav Links ── */}
      <div
        className={`hidden md:block border-t border-border transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="text-sm text-foreground/70 hover:text-primary transition-colors px-4 py-3 relative group whitespace-nowrap"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layer 3: Meal Category Strip ── */}
      <div
        className={`hidden md:block border-t border-border transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
            {categoryStrip.map((cat, index) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * index }}
                onClick={() => setActiveMealCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                  activeMealCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground/60 hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border"
          >
            <div className="px-4 py-4 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg border border-border bg-secondary">
                <Search className="w-4 h-4 text-foreground/40 shrink-0" />
                <input
                  type="text"
                  placeholder="Search recipes, ingredients..."
                  className="bg-transparent text-sm text-foreground placeholder:text-foreground/40 outline-none w-full"
                />
              </div>

              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-2 text-foreground/70 hover:text-primary transition-colors rounded-md hover:bg-secondary"
                >
                  {link.name}
                </a>
              ))}

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-foreground/40 mb-2 px-2">Meal Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categoryStrip.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveMealCategory(cat); setMobileMenuOpen(false); }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                        activeMealCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-secondary text-foreground/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center gap-4 px-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); onSavedClick(); }}
                  className="flex items-center gap-1.5 text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  <Heart className={`w-4 h-4 ${savedCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                  Saved {savedCount > 0 && `(${savedCount})`}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleAccountClick(); }}
                  className="flex items-center gap-1.5 text-sm text-foreground/70 hover:text-primary transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user ? (user.user_metadata?.full_name ?? 'Account') : 'Sign In'}
                </button>
                {user && (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-sm text-red-500"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}