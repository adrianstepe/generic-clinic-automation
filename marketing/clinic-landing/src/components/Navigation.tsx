import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationProps {
  clinicName: string;
  phone: string;
}

const Navigation = ({ clinicName, phone }: NavigationProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;

  // Get initials for logo
  const initials = clinicName
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#pakalpojumi", label: "Pakalpojumi" },
    { href: "#kontakti", label: "Kontakti" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-soft py-3"
          : "bg-transparent py-6"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${scrolled ? "bg-primary" : "bg-primary/90"
              }`}>
              <span className="text-primary-foreground font-display font-bold text-lg">{initials}</span>
            </div>
            <span className={`font-display text-xl font-semibold transition-colors duration-300 ${scrolled ? "text-foreground" : "text-foreground"
              }`}>
              {clinicName}
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors duration-300 relative group ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-foreground/80 hover:text-foreground"
                  }`}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="default"
                className="rounded-full px-6 shadow-md hover:shadow-lg transition-shadow"
                asChild
              >
                <a href={phoneHref}>
                  <Phone className="w-4 h-4 mr-2" />
                  Zvanīt
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pb-4 border-t border-border/50"
            >
              <div className="flex flex-col gap-4 pt-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-foreground font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Button className="w-full rounded-full mt-2" asChild>
                  <a href={phoneHref}>
                    <Phone className="w-4 h-4 mr-2" />
                    Zvanīt
                  </a>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
