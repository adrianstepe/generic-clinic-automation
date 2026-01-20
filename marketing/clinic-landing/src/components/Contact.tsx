import { MapPin, Phone, Clock, Mail, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useScrollAnimation, fadeInLeft, fadeInRight, fadeInUp, staggerContainer, staggerItem } from "@/hooks/useScrollAnimation";

const contactInfo = [
  {
    icon: MapPin,
    title: "Adrese",
    details: "Brīvības iela 123, Rīga, LV-1001",
    link: "https://maps.google.com",
  },
  {
    icon: Phone,
    title: "Tālrunis",
    details: "+371 29 206 450",
    link: "tel:+37129206450",
  },
  {
    icon: Mail,
    title: "E-pasts",
    details: "info@dentalux.lv",
    link: "mailto:info@dentalux.lv",
  },
  {
    icon: Clock,
    title: "Darba Laiks",
    details: "Pr-Pk: 8:00-20:00 | Se: 9:00-15:00",
    link: null,
  },
];

const Contact = () => {
  const [leftRef, leftControls] = useScrollAnimation(0.2);
  const [rightRef, rightControls] = useScrollAnimation(0.2);

  return (
    <section id="kontakti" className="py-32 bg-secondary/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-accent/5 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Info */}
          <motion.div
            ref={leftRef}
            variants={staggerContainer}
            initial="hidden"
            animate={leftControls}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-primary font-medium mb-4 text-sm uppercase tracking-wider"
            >
              Kontakti
            </motion.span>
            <motion.h2 
              variants={fadeInLeft}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            >
              Apmeklējiet
              <span className="block text-primary">Mūs</span>
            </motion.h2>
            <motion.p 
              variants={fadeInLeft}
              className="text-muted-foreground text-lg mb-12 leading-relaxed max-w-lg"
            >
              Atrodamies Rīgas centrā ar ērtu piekļuvi no visas pilsētas. Bezmaksas autostāvvieta pacientiem.
            </motion.p>
            
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
            >
              {contactInfo.map((item, index) => (
                <motion.a
                  key={index}
                  variants={staggerItem}
                  href={item.link || "#"}
                  className={`flex items-start gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-300 ${
                    item.link ? "hover:bg-card hover:border-primary/20 hover:shadow-soft cursor-pointer group" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground">{item.details}</p>
                  </div>
                  {item.link && (
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:text-primary" />
                  )}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div 
            ref={rightRef}
            variants={fadeInRight}
            initial="hidden"
            animate={rightControls}
            className="lg:sticky lg:top-32"
          >
            <div className="bg-card rounded-3xl p-8 md:p-10 shadow-elegant border border-border/50">
              <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
                Sazināties ar Mums
              </h3>
              <p className="text-muted-foreground mb-8">
                Atstājiet savu kontaktinformāciju un mēs sazināsimies ar jums darba dienas laikā.
              </p>
              
              <form className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Vārds
                    </label>
                    <input 
                      type="text"
                      placeholder="Jūsu vārds"
                      className="w-full px-4 py-4 rounded-xl bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tālrunis
                    </label>
                    <input 
                      type="tel"
                      placeholder="+371 20 000 000"
                      className="w-full px-4 py-4 rounded-xl bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-pasts
                  </label>
                  <input 
                    type="email"
                    placeholder="jusu@epasts.lv"
                    className="w-full px-4 py-4 rounded-xl bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ziņojums
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Jūsu jautājums vai vēlamais pakalpojums..."
                    className="w-full px-4 py-4 rounded-xl bg-secondary border border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:outline-none transition-all resize-none"
                  />
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow" size="lg">
                    Nosūtīt Ziņojumu
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
