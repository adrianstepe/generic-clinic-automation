import { Sparkles, Heart, Smile, Zap, Shield, Stethoscope } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollAnimation, fadeInUp, staggerContainer, staggerItem } from "@/hooks/useScrollAnimation";
import { useRef } from "react";

const services = [
  {
    icon: Sparkles,
    title: "Profesionālā Higiēna",
    description: "Mūsdienīga ultraskaņas un Air-Flow tehnoloģija dziļai zobu tīrīšanai. Jūsu smaids atgūs dabisko mirdzumu.",
    features: ["Ultraskaņas tīrīšana", "Air-Flow pulēšana", "Fluorīda aizsardzība"],
  },
  {
    icon: Heart,
    title: "Zobu Ārstēšana",
    description: "Nesāpīga ārstēšana ar jaunākajiem anestēzijas risinājumiem. Mēs izmantojam tikai augstākās kvalitātes materiālus.",
    features: ["Beztraumatiski", "Premium materiāli", "Digitālā diagnostika"],
  },
  {
    icon: Smile,
    title: "Estētiskā Zobārstniecība",
    description: "Radām perfektus smaidu kopā ar jums. No profesionālās balināšanas līdz pilnīgam smaida dizainam.",
    features: ["Smaida dizains", "Keramikas vīnīri", "Profesionālā balināšana"],
  },
  {
    icon: Zap,
    title: "Zobu Implantācija",
    description: "Premium klases implanti ar precīzu 3D plānošanu. Mūža garantija visiem implantiem.",
    features: ["3D diagnostika", "Straumann implanti", "Mūža garantija"],
  },
  {
    icon: Shield,
    title: "Profilakse",
    description: "Regulāras profilaktiskās apskates ir veselīga smaida pamats. Mēs rūpējamies par jūsu zobu veselību ilgtermiņā.",
    features: ["Pilna apskate", "Ārstēšanas plāns", "Digitālais rentgens"],
  },
  {
    icon: Stethoscope,
    title: "Ķirurģija",
    description: "Mūsdienīgas zobu ķirurģijas procedūras ar minimālu atveseļošanās laiku un maksimālu komfortu.",
    features: ["Minimāli invazīvi", "Ātra atveseļošanās", "Sedācija pieejama"],
  },
];

const Services = () => {
  const [headerRef, headerControls] = useScrollAnimation(0.2);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section id="pakalpojumi" className="py-32 lg:py-40 relative overflow-hidden bg-muted/30" ref={containerRef}>
      {/* Parallax background elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </motion.div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div 
          ref={headerRef}
          className="max-w-3xl mb-20 lg:mb-28"
          variants={staggerContainer}
          initial="hidden"
          animate={headerControls}
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-primary" />
            <span className="text-primary font-medium text-sm uppercase tracking-[0.2em]">
              Pakalpojumi
            </span>
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight"
          >
            Mūsu Ekspertīze
            <span className="block text-primary/80">Jūsu Smaidam</span>
          </motion.h2>
          
          <motion.p 
            variants={fadeInUp}
            className="text-muted-foreground text-lg md:text-xl leading-relaxed"
          >
            Piedāvājam pilnu zobārstniecības pakalpojumu klāstu, izmantojot 
            jaunākās tehnoloģijas un individuālu pieeju katram pacientam.
          </motion.p>
        </motion.div>
        
        {/* Services List - Elegant Layout */}
        <div className="space-y-6">
          {services.map((service, index) => (
            <ServiceRow key={index} service={service} index={index} />
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div 
          className="mt-20 lg:mt-28 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <p className="text-muted-foreground mb-6 text-lg">
            Precīzas cenas uzzināsiet bezmaksas konsultācijā
          </p>
          <motion.a
            href="#kontakti"
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Pieteikt Konsultāciju</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

interface ServiceRowProps {
  service: typeof services[0];
  index: number;
}

const ServiceRow = ({ service, index }: ServiceRowProps) => {
  const [ref, controls] = useScrollAnimation(0.2);
  
  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      initial="hidden"
      animate={controls}
      custom={index}
    >
      <motion.div 
        className="group relative bg-card rounded-2xl p-8 lg:p-10 border border-border/50 hover:border-primary/30 transition-all duration-500 overflow-hidden"
        whileHover={{ y: -4 }}
      >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
          {/* Icon & Number */}
          <div className="flex items-center gap-6 lg:min-w-[200px]">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <service.icon className="w-6 h-6 text-primary" />
            </motion.div>
            <span className="text-6xl font-display font-bold text-muted/30 group-hover:text-primary/20 transition-colors duration-500">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 lg:border-l lg:border-border/50 lg:pl-12">
            <h3 className="font-display text-2xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
              {service.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-5 max-w-2xl">
              {service.description}
            </p>
            
            {/* Feature Tags */}
            <div className="flex flex-wrap gap-2">
              {service.features.map((feature, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 bg-muted/50 rounded-full text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          {/* Arrow indicator */}
          <motion.div 
            className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full border border-border group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300"
            whileHover={{ scale: 1.1, x: 5 }}
          >
            <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Services;
