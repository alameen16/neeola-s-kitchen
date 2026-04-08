import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { products } from '../../data/products';

interface FeaturedProductsProps {
  addToCart: (item: { id: number; name: string; price: number; image: string }) => void;
  activeMealCategory: string;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}

export function FeaturedProducts({
  addToCart,
  activeMealCategory,
  favorites,
  onToggleFavorite,
}: FeaturedProductsProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredProducts =
    activeMealCategory === 'All'
      ? products
      : products.filter((p) => p.mealCategory.includes(activeMealCategory));

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <section id="products" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Featured Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {activeMealCategory !== 'All'
              ? `Showing products for: ${activeMealCategory}`
              : 'Handpicked premium items that define quality and style'}
          </p>
          {activeMealCategory !== 'All' && (
            <motion.p
              key={activeMealCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground mt-2"
            >
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </motion.p>
          )}
        </motion.div>

        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground"
          >
            <p className="text-lg">No products found for "{activeMealCategory}".</p>
            <p className="text-sm mt-2">Try selecting a different category from the menu above.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                    {product.badge}
                  </div>
                )}

                {!product.inStock && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                    Out of Stock
                  </div>
                )}

                {/* Heart button — updates shared favorites state in App */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleFavorite(product.id)}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      favorites.includes(product.id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>

                <div className="relative aspect-square overflow-hidden bg-secondary">
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-xs text-primary font-medium">{product.category}</span>
                    {product.mealCategory.slice(0, 2).map((mc) => (
                      <span
                        key={mc}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                      >
                        {mc}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">£{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          £{product.originalPrice}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                        })
                      }
                      disabled={!product.inStock}
                      className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {hasMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="px-8 py-4 bg-secondary border border-border text-foreground rounded-full font-medium hover:bg-muted transition-all hover:scale-105"
            >
              Load More Products
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}