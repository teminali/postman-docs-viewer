"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  FileJson,
  Bot,
  GitBranch,
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
  Code2,
  BookOpen,
  Search,
  Cloud,
  Lock,
  ChevronDown,
  Terminal,
  Cpu,
  Network,
  Eye,
  MessageSquare,
  Workflow,
  Rocket,
  Globe,
  Users,
  Layers,
  Binary,
  ScanEye,
  Sparkle,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Animated background particles
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createParticles = () => {
      particles = [];
      const count = Math.min(50, Math.floor(window.innerWidth / 30));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity})`;
        ctx.fill();
        
        // Draw connections
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${0.1 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        });
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    resize();
    createParticles();
    draw();
    
    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

// Glitch text effect
function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 text-red-500 opacity-70 animate-pulse" style={{ clipPath: "inset(0 0 50% 0)", animation: "glitch-1 2s infinite linear alternate-reverse" }}>
        {text}
      </span>
      <span className="absolute top-0 left-0 ml-0.5 text-cyan-500 opacity-70" style={{ clipPath: "inset(50% 0 0 0)", animation: "glitch-2 3s infinite linear alternate-reverse" }}>
        {text}
      </span>
    </span>
  );
}

// Typing effect
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [started, text]);
  
  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

// Feature card with hover effects
function FeatureCard({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur" />
      <div className="relative h-full p-6 bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className="w-24 h-24" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Stat counter
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const increment = value / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-2">{label}</div>
    </div>
  );
}

// Section divider with animated line
function SectionDivider() {
  return (
    <div className="relative h-24 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="w-32 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute"
      >
        <Sparkles className="w-6 h-6 text-blue-400" />
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);
  
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const ySpring = useSpring(y, springConfig);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(0 0 50% 0); transform: translateX(-2px); }
          20% { clip-path: inset(20% 0 60% 0); transform: translateX(2px); }
          40% { clip-path: inset(40% 0 30% 0); transform: translateX(-2px); }
          60% { clip-path: inset(60% 0 10% 0); transform: translateX(2px); }
          80% { clip-path: inset(80% 0 5% 0); transform: translateX(-2px); }
        }
        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(50% 0 0 0); transform: translateX(2px); }
          20% { clip-path: inset(30% 0 20% 0); transform: translateX(-2px); }
          40% { clip-path: inset(10% 0 40% 0); transform: translateX(2px); }
          60% { clip-path: inset(40% 0 30% 0); transform: translateX(-2px); }
          80% { clip-path: inset(20% 0 50% 0); transform: translateX(2px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite 3s; }
      `}</style>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl"
      >
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link href="/app" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50" />
              <FileJson className="relative w-6 h-6 text-blue-400" />
            </div>
            <span className="font-bold text-lg">NexusDocer</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                Explore Docs
              </Button>
            </Link>
            <Link href="/app">
              <Button size="sm" className="gap-2">
                Launch App
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-background" />
        <ParticleField />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating elements */}
        <motion.div
          style={{ y: ySpring, opacity, scale }}
          className="relative z-10 container px-4 mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">The Future is Here</span>
              <span className="text-muted-foreground">— Powered by Gemini AI</span>
            </div>
          </motion.div>

          {/* Main headline */}
          <div className="text-center max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="block mb-2">We Are Witnessing</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                <GlitchText text="The Great Rewrite" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Artificial Intelligence is not just changing how we code—it is 
              <span className="text-foreground font-medium"> fundamentally rewiring </span> 
              how humans interact with knowledge. We stand at the precipice of a new era.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/app">
                <Button size="lg" className="gap-2 text-base px-8 py-6">
                  <Rocket className="w-5 h-5" />
                  Enter the Future
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6" asChild>
                <a href="#story">
                  Read the Story
                  <ChevronDown className="w-5 h-5" />
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 relative"
          >
            <div className="relative max-w-4xl mx-auto">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              
              {/* Main visual */}
              <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">AI Assistant</div>
                        <div className="text-xs text-muted-foreground">Online • Gemini 2.5 Flash</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <TypewriterText text="Analyzing your API collection..." delay={1500} />
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                        <TypewriterText text="I've identified 47 endpoints across 12 folders. Would you like me to generate a flowchart showing the authentication flow?" delay={2500} />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl" />
                    <div className="relative p-4 font-mono text-xs space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Terminal className="w-4 h-4" />
                        <span>api-documentation.md</span>
                      </div>
                      <div className="space-y-1 text-green-400">
                        <div>## User Management API</div>
                        <div className="text-blue-400">### POST /api/v1/users</div>
                        <div className="text-muted-foreground">Create a new user account...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          >
            <motion.div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* The Story Section */}
      <section id="story" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-500/[0.02] to-background" />
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm mb-6"
            >
              <Brain className="w-4 h-4" />
              The Paradigm Shift
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Down the Rabbit Hole We Go
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Remember when documentation was a chore? When understanding a new API meant 
              hours of reading, testing, and deciphering? Those days are vanishing faster 
              than we can comprehend.
            </motion.p>
          </div>

          {/* Story cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Eye,
                title: "The Old World",
                description: "Static documentation that aged the moment it was written. Developers drowning in outdated READMEs, desperately trying to piece together how things actually worked.",
                color: "from-red-500/20 to-orange-500/20",
                iconColor: "text-red-400",
              },
              {
                icon: Zap,
                title: "The Awakening",
                description: "Large Language Models emerged—not just as tools, but as cognitive extensions. They don't just store knowledge; they understand, connect, and explain.",
                color: "from-yellow-500/20 to-amber-500/20",
                iconColor: "text-yellow-400",
              },
              {
                icon: Sparkle,
                title: "The New Reality",
                description: "AI doesn't just display your API—it comprehends it. It answers questions, generates flowcharts, suggests implementations. The documentation became alive.",
                color: "from-blue-500/20 to-purple-500/20",
                iconColor: "text-blue-400",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative h-full p-8 bg-card/50 backdrop-blur border border-border/50 rounded-2xl text-center">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-6 mx-auto`}>
                    <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* The Problem Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm mb-6">
                <AlertCircle className="w-4 h-4" />
                The Pain We Know
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Documentation is
                <span className="text-red-400"> Broken</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The average developer spends <span className="text-foreground font-medium">4+ hours per week</span> just 
                  trying to understand APIs. That's 200+ hours per year—per developer—lost to documentation archaeology.
                </p>
                <p>
                  Postman collections contain the truth, but that truth is buried in JSON, hidden behind cryptic 
                  field names, scattered across dozens of endpoints. The knowledge exists, but it's 
                  <span className="text-foreground font-medium"> inaccessible</span>.
                </p>
                <p>
                  We built tools to help us build tools. The irony would be funny if it weren't so expensive.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 space-y-4">
                {[
                  { stat: "73%", text: "of developers struggle with outdated API docs" },
                  { stat: "60%", text: "of implementation time is spent understanding APIs" },
                  { stat: "4.2hrs", text: "average weekly time lost to documentation" },
                  { stat: "$50B", text: "annual global cost of poor documentation" },
                ].map((item, i) => (
                  <motion.div
                    key={item.stat}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/50 text-center"
                  >
                    <div className="text-2xl font-bold text-red-400">{item.stat}</div>
                    <div className="text-sm text-muted-foreground">{item.text}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* The Solution Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-green-500/[0.02] to-background" />
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm mb-6"
            >
              <Sparkle className="w-4 h-4" />
              The Solution
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Meet Your AI-Powered
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Documentation Companion
              </span>
            </motion.h2>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={FileJson}
              title="Instant Transformation"
              description="Drop your Postman collection and watch as it transforms into beautiful, navigable documentation in milliseconds."
              delay={0}
            />
            <FeatureCard
              icon={Bot}
              title="AI That Understands"
              description="Ask questions in plain English. Our AI analyzes your entire API and provides intelligent, contextual answers."
              delay={0.1}
            />
            <FeatureCard
              icon={GitBranch}
              title="Visual Flowcharts"
              description="Automatically generated Mermaid diagrams showing API flows, authentication sequences, and data relationships."
              delay={0.2}
            />
            <FeatureCard
              icon={Code2}
              title="Dual-Mode Views"
              description="Switch between Developer Mode with technical details and User Mode with plain English explanations."
              delay={0.3}
            />
            <FeatureCard
              icon={Search}
              title="Intelligent Search"
              description="Fuzzy search across endpoints, methods, URLs, and descriptions. Find what you need instantly."
              delay={0.4}
            />
            <FeatureCard
              icon={Cloud}
              title="Publish & Share"
              description="Publish your docs to Firebase with public or private visibility. Share with your team or the world."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* AI Features Deep Dive */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1 flex justify-center"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Nexus AI Assistant</div>
                    <div className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 text-sm">
                      How does authentication work in this API?
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[80%]">
                      The API uses Bearer token authentication. First, call <code className="text-blue-400">POST /auth/login</code> with credentials. The response includes an access token valid for 24 hours and a refresh token...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 text-sm">
                      Show me the user registration flow
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[80%]">
                      I've generated a flowchart showing the complete registration flow. You can view it in the Flowchart panel. The sequence is: Validate Email → Create Account → Send Verification → Activate Account.
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm mb-6">
                <Cpu className="w-4 h-4" />
                Beyond Static Docs
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Documentation That
                <span className="text-blue-400"> Thinks</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Traditional documentation is dead text. NexusDocer brings it to life with 
                  <span className="text-foreground font-medium"> contextual AI understanding</span>.
                </p>
                <p>
                  The AI doesn't just search—it comprehends. It understands relationships between endpoints, 
                  recognizes authentication patterns, and can explain complex flows in simple terms.
                </p>
                <ul className="space-y-3 pt-4 text-left inline-block">
                  {[
                    "Ask questions in natural language",
                    "Get contextual answers based on your specific API",
                    "Generate implementation prompts for any AI coding assistant",
                    "Discover related endpoints you might have missed",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* Stats Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCounter value={100} suffix="%" label="Free to Use" />
            <StatCounter value={47} suffix="ms" label="Avg. Parse Time" />
            <StatCounter value={12} suffix="+" label="AI Features" />
            <StatCounter value={1000} suffix="+" label="Collections Processed" />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* The Future Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm mb-6"
            >
              <Rocket className="w-4 h-4" />
              Where This Leads
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              The Rabbit Hole Goes
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Deeper</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              We're at the beginning of something profound. AI isn't just changing tools—
              it's changing how humans interact with complexity itself.
            </motion.p>
          </div>

          {/* Future vision cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Network,
                title: "Neural APIs",
                description: "APIs that understand intent, not just syntax. Natural language becomes the programming interface.",
              },
              {
                icon: ScanEye,
                title: "Self-Documenting",
                description: "Code that explains itself. Documentation generated automatically from runtime behavior.",
              },
              {
                icon: Binary,
                title: "AI Synthesis",
                description: "Multiple AIs collaborating—one reads the docs, one writes the code, one tests the integration.",
              },
              {
                icon: Globe,
                title: "Universal Access",
                description: "Language barriers dissolve. APIs become accessible to developers worldwide, regardless of English proficiency.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur opacity-0 group-hover:opacity-50" />
                <div className="relative h-full p-6 bg-card/50 backdrop-blur border border-border/50 rounded-2xl hover:border-purple-500/30 transition-colors text-center">
                  <card.icon className="w-10 h-10 text-purple-400 mb-4 mx-auto block" />
                  <h3 className="font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-500/5 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[128px]" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Enter
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                The New Era?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of developers who have already stepped through the looking glass. 
              Your API documentation will never be the same.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="gap-2 text-base px-8 py-6 animate-pulse" style={{ animation: "pulse-glow 2s ease-in-out infinite" }}>
                  <Rocket className="w-5 h-5" />
                  Launch NexusDocer
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              Free forever. No credit card required. Your data stays yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-blue-400" />
              <span className="font-semibold">NexusDocer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground transition-colors">App</Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 NexusDocer. Built for the AI age.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


