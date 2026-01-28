import { MessageCircle, X, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const SupportBubble = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="bg-card border border-border/50 shadow-elegant rounded-2xl p-6 w-80 mb-2"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-display font-semibold text-lg text-foreground">Jautājumi?</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <p className="text-muted-foreground text-sm mb-6">
                            Mēs labprāt atbildēsim uz jūsu jautājumiem. Izvēlieties saziņas veidu:
                        </p>

                        <div className="space-y-3">
                            <a
                                href="tel:+37129206450"
                                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Zvanīt mums</span>
                            </a>

                            <a
                                href="mailto:info@dentalux.lv"
                                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Rakstīt e-pastu</span>
                            </a>
                        </div>

                        <div className="mt-6 pt-4 border-t border-border/50 text-center">
                            <p className="text-xs text-muted-foreground">
                                Atbildam darba laikā: Pr-Pk 8-20
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-8 h-8" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle className="w-8 h-8" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default SupportBubble;
