import { motion } from "framer-motion";
import { Star, Phone, Bot, PlayCircle } from "lucide-react";
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
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full py-24 lg:py-32">
          {/* Left Content */}
          <motion.div
            className="space-y-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Personalized Badge - THE TROJAN HORSE */}
            <motion.div
              variants={fadeInLeft}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full"
            >
              <span className="text-sm font-medium text-primary">Izveidots priekš</span>
              <span className="text-sm font-bold text-foreground">{clinicName}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInLeft}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              Jūsu jauna
              <span className="block text-primary">pieraksta sistēma.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInLeft}
              className="text-lg text-muted-foreground max-w-lg leading-relaxed"
            >
              Redziet, kā jūsu pacienti varētu pierakstīties tiešsaistē — 24/7, bez telefona zvaniem.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Button
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
              className="flex flex-wrap gap-8 pt-6"
            >
              <motion.div
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-1">
                  <span className="font-display text-3xl font-bold text-foreground">4.9</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">Google Atsauksmes</span>
                </div>
              </motion.div>

              <motion.div
                variants={staggerItem}
                className="flex items-center gap-3"
              >
                <span className="font-display text-3xl font-bold text-foreground">15+</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">Gadu</span>
                  <span className="text-xs text-muted-foreground">pieredze</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Widget Showcase */}
          <motion.div
            className="flex flex-col items-center lg:items-end"
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
          >
            {/* Showcase Header */}
            <div className="w-full max-w-md mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Automatizēta Pieraksta Sistēma
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-emerald-600">24/7 AKTĪVS</span>
                </div>
              </div>
            </div>

            {/* The widget */}
            <BookingWidget />

            {/* Test Booking Button - LOW RISK CTA */}
            <motion.div
              className="w-full max-w-md mt-4"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Button
                size="lg"
                className="w-full px-8 py-6 text-lg rounded-2xl shadow-elegant hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-primary hover:bg-primary/90"
                onClick={() => document.getElementById('booking-widget-container')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Testēt Rezervāciju
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Bez maksas • Bez saistībām • Tikai demonstrācija
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
