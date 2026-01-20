import { useEffect, useRef, useState } from "react";
import { useInView, useAnimation, Variants } from "framer-motion";

// Professional scroll animation variants
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    filter: "blur(8px)"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInDown: Variants = {
  hidden: { 
    opacity: 0, 
    y: -40,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -80,
    filter: "blur(4px)"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 80,
    filter: "blur(4px)"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.8, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: { 
      duration: 0.7, 
      ease: [0.34, 1.56, 0.64, 1]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const slideReveal: Variants = {
  hidden: { 
    clipPath: "inset(0 100% 0 0)",
    opacity: 0
  },
  visible: { 
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { 
      duration: 1, 
      ease: [0.77, 0, 0.175, 1]
    }
  }
};

export const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const glowPulse: Variants = {
  hidden: { 
    opacity: 0,
    boxShadow: "0 0 0 0 rgba(var(--primary), 0)"
  },
  visible: { 
    opacity: 1,
    boxShadow: "0 25px 80px -12px hsl(var(--primary) / 0.25)",
    transition: { 
      duration: 0.8, 
      ease: "easeOut"
    }
  }
};

// Custom hook for scroll-triggered animations
export function useScrollAnimation(threshold: number = 0.2): [React.RefObject<HTMLDivElement | null>, ReturnType<typeof useAnimation>] {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return [ref, controls];
}

// Text reveal animation for headlines
export const textReveal: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03
    }
  }
};

export const letterReveal: Variants = {
  hidden: { 
    opacity: 0,
    y: 50,
    rotateX: -90
  },
  visible: { 
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Parallax scroll effect
export function useParallax(offset: number = 50) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollY * (offset / 1000);
}
