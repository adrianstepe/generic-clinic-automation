import { motion } from "framer-motion";
import { Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingWidget from "./BookingWidget";
import dentalHero from "@/assets/dental-hero.jpg";
import { fadeInLeft, fadeInRight, fadeInUp, staggerContainer, staggerItem, useParallax } from "@/hooks/useScrollAnimation";

interface HeroProps {
  clinicName: string;
  phone: string;
}

const Hero = ({ clinicName, phone }: HeroProps) => {
  const parallaxOffset = useParallax(30);
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Hero Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: parallaxOffset }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40 z-10" />
        <img
          src={dentalHero}
          alt="Modern dental clinic"
          className="w-full h-full object-cover scale-110"
        />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-32">
          {/* Left Content */}
          <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Headline */}
            <motion.h1
              variants={fadeInLeft}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              Jūsu smaids ir mūsu
              <span className="block text-primary">prioritāte.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInLeft}
              className="text-xl text-muted-foreground max-w-lg leading-relaxed"
            >
              Moderna zobārstniecība Rīgas sirdī. Bez sāpēm, bez stresa, un ar garantiju.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-full shadow-elegant hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => document.getElementById('booking-widget-container')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Pieteikt vizīti
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg rounded-full border-2 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 group"
                asChild
              >
                <a href={phoneHref}>
                  <Phone className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  {phone}
                </a>
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={staggerContainer}
              className="flex flex-wrap gap-8 pt-8"
            >
              <motion.div
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">4.9</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">Google Atsauksmes</span>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <span className="font-display text-4xl font-bold text-foreground">15+</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Gadu</span>
                  <span className="text-sm text-muted-foreground">pieredze</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Booking Widget */}
          <motion.div
            className="flex justify-center lg:justify-end"
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
          >
            <BookingWidget />
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
