import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingCart } from 'lucide-react';
import { products } from '../../data/products';

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedIds: number[];
  addToCart: (item: { id: number; name: string; price: number; image: string }) => void;
  onToggleFavorite: (id: number) => void;
}

export function SavedDrawer({
  isOpen,
  onClose,
  savedIds,
  addToCart,
  onToggleFavorite,
}: SavedDrawerProps) {
  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                <h2 className="text-lg font-bold">Saved Items</h2>
                {savedProducts.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({savedProducts.length})
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {savedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-20">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Nothing saved yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tap the heart on any product to save it here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex gap-4 p-3 bg-card border border-border rounded-2xl"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary mb-0.5">{product.category}</p>
                        <p className="font-semibold text-sm leading-tight line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-primary font-bold mt-1">£{product.price}</p>
                        {product.originalPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            £{product.originalPrice}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        {/* Remove from saved */}
                        <button
                          onClick={() => onToggleFavorite(product.id)}
                          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                          aria-label="Remove from saved"
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>

                        {/* Add to cart */}
                        <button
                          onClick={() =>
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                            })
                          }
                          disabled={!product.inStock}
                          className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Add to cart"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
