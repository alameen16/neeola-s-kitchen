import { ChefHat, Mail, Phone, MapPin, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { FaTiktok, FaWhatsapp, FaInstagram, FaYoutube, FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal, FaApplePay, FaGooglePay } from 'react-icons/fa';
import { motion } from 'motion/react';

export function KitchenFooter() {
const footerLinks = {
    Shop: ['All Products', 'Cookware', 'Appliances', 'Utensils', 'Storage', 'New Arrivals'],
    Company: ['About Us', 'Our Story', 'Careers', 'Press', 'Blog', 'Reviews'],
    Support: ['Help Center', 'Contact Us', 'Shipping Info', 'Returns', 'Track Order', 'FAQs'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Accessibility'],
  };

  const socialLinks = [
    { icon: FaTiktok, href: 'https://www.tiktok.com/@neeolaSkitchen', label: 'Tiktok' },
    { icon: FaWhatsapp, href: 'https://wa.me/447769921905', label: 'Whatsapp' },
    { icon: FaInstagram, href: 'https://www.instagram.com/neeolas_taste', label: 'Instagram' },
    { icon: FaYoutube, href: 'https://www.youtube.com/@neeolaSkitchen', label: 'Youtube' },
  ];

  const trustBadges = [
    { icon: Truck, label: 'Free Shipping over £200' },
    { icon: RefreshCw, label: '7 Day Returns' },
    { icon: ShieldCheck, label: 'Secure Checkout' },
  ];

  const paymentIcons = [
    { icon: FaCcVisa, label: 'Visa' },
    { icon: FaCcMastercard, label: 'Mastercard' },
    { icon: FaCcAmex, label: 'Amex' },
    { icon: FaCcPaypal, label: 'PayPal' },
    { icon: FaApplePay, label: 'Apple Pay' },
    { icon: FaGooglePay, label: 'Google Pay' },
  ];

  return (
    <footer className="bg-secondary/30 border-t border-border">

      {/* Trust Badges Strip */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="w-4 h-4 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Neeola's Kitchen</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Unleashing the Power of Sophisticated Cuisine.
              since 2022.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>up2155926@myport.ac.uk</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+44 7769 921905</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Osborne road, Central Southsea, Portsmouth Po5 3LR</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border space-y-4">

          {/* Payment Icons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">Secure payments powered by Stripe</p>
            <div className="flex items-center gap-3">
              {paymentIcons.map(({ icon: Icon, label }) => (
                <Icon key={label} className="w-8 h-8 text-muted-foreground" aria-label={label} />
              ))}
            </div>
          </div>

          {/* Copyright + Socials */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Neeola's Kitchen. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={label}
                  className="p-2 bg-secondary hover:bg-primary hover:text-white rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}