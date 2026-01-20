import { motion } from "framer-motion";
import { Instagram, Facebook, Phone, Mail } from "lucide-react";

interface FooterProps {
  clinicName: string;
  phone: string;
  email?: string;
}

const Footer = ({ clinicName, phone, email }: FooterProps) => {
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;
  const emailHref = email ? `mailto:${email}` : undefined;

  // Get initials for logo
  const initials = clinicName
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <footer className="py-16 bg-foreground text-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-3 gap-12 items-center mb-12">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center">
              <span className="text-foreground font-display font-bold text-lg">{initials}</span>
            </div>
            <div>
              <span className="font-display text-xl font-semibold block">{clinicName}</span>
              <span className="text-background/60 text-sm">Premium Zobārstniecība</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <div className="flex items-center justify-center gap-8">
            <a href="#pakalpojumi" className="text-background/70 hover:text-background transition-colors duration-300">
              Pakalpojumi
            </a>
            <a href="#kontakti" className="text-background/70 hover:text-background transition-colors duration-300">
              Kontakti
            </a>
          </div>

          {/* Contact & Social */}
          <div className="flex items-center justify-end gap-4">
            <motion.a
              href={phoneHref}
              className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-5 h-5" />
            </motion.a>
            {emailHref && (
              <motion.a
                href={emailHref}
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="w-5 h-5" />
              </motion.a>
            )}
            <motion.a
              href="#"
              className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="#"
              className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Facebook className="w-5 h-5" />
            </motion.a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-background/50 text-sm">
            <p>© 2026 {clinicName}. Visas tiesības aizsargātas.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-background transition-colors">Privātuma Politika</a>
              <a href="#" className="hover:text-background transition-colors">Lietošanas Noteikumi</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
