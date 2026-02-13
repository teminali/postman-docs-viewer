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
  Code2,
  BookOpen,
  Search,
  Cloud,
  Lock,
  ChevronDown,
  Terminal,
  Cpu,
  Eye,
  CheckCircle,
  Rocket,
  Globe,
  Layers,
  Binary,
  ScanEye,
  Database,
  Play,
  Download,
  Copy,
  FileCode,
  Workflow,
  Github,
  ExternalLink,
  ChevronRight,
  Flame,
  Shield,
  RefreshCw,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================
// ANIMATION COMPONENTS
// ============================================

// Animated background with flowing gradient
function GradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
    </div>
  );
}

// Particle network animation
function ParticleNetwork() {
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
    }> = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createParticles = () => {
      particles = [];
      const count = Math.min(30, Math.floor(window.innerWidth / 50));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
        });
      }
    };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = 0.1 * (1 - dist / 200);
            ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      
      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147, 197, 253, 0.5)";
        ctx.fill();
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

// Floating code symbols
function FloatingSymbols() {
  const symbols = ["{ }", "</>", "[]", "api", "GET", "POST", "JSON", "TS"];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((symbol, i) => (
        <motion.div
          key={symbol}
          className="absolute text-muted-foreground/10 font-mono text-lg font-bold"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) 
          }}
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ 
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
          style={{
            left: `${10 + (i * 10)}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// UI COMPONENTS
// ============================================

// Feature card with hover effects
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay,
  color = "blue"
}: { 
  icon: any; 
  title: string; 
  description: string; 
  delay: number;
  color?: "blue" | "purple" | "green" | "orange" | "pink";
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 text-blue-400",
    purple: "from-purple-500/20 to-pink-500/20 text-purple-400",
    green: "from-green-500/20 to-emerald-500/20 text-green-400",
    orange: "from-orange-500/20 to-amber-500/20 text-orange-400",
    pink: "from-pink-500/20 to-rose-500/20 text-pink-400",
  };
  
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
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].split(" ").pop()}`} />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Bento grid feature card
function BentoCard({ 
  icon: Icon, 
  title, 
  description, 
  className = "",
  delay = 0,
  large = false
}: { 
  icon: any; 
  title: string; 
  description: string; 
  className?: string;
  delay?: number;
  large?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={`group relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur border border-border/50 p-6 hover:border-blue-500/30 transition-colors ${large ? "md:col-span-2 md:row-span-2" : ""} ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className={`text-sm text-muted-foreground ${large ? "text-base" : ""}`}>{description}</p>
      </div>
    </motion.div>
  );
}

// Stat counter with animation
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

// Framework badge
function FrameworkBadge({ name, lang, delay }: { name: string; lang: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur border border-border/50 hover:border-blue-500/30 transition-colors cursor-default"
    >
      <FileCode className="w-4 h-4 text-blue-400" />
      <span className="font-medium text-sm">{name}</span>
      <Badge variant="secondary" className="text-xs">{lang}</Badge>
    </motion.div>
  );
}

// Typing effect for code demo
function TypewriterCode({ code, delay = 0 }: { code: string; delay?: number }) {
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
      if (i <= code.length) {
        setDisplayed(code.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [started, code]);
  
  return (
    <pre className="font-mono text-xs md:text-sm">
      <code dangerouslySetInnerHTML={{ 
        __html: displayed
          .replace(/(const|let|var|function|return|async|await|import|from|export|interface|type)/g, '<span class="text-purple-400">$1</span>')
          .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>')
          .replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground">$1</span>')
          .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>')
          .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-blue-400">$1</span>')
      }} />
      <span className="animate-pulse">|</span>
    </pre>
  );
}

// Interactive code demo tabs
function CodeDemo() {
  const [activeTab, setActiveTab] = useState<"prompt" | "typescript" | "python">("prompt");
  
  const codeExamples = {
    prompt: `You are implementing the User Management API.

## ENDPOINT: POST /api/v1/users

Create a new user account with the following schema:

\`\`\`typescript
interface CreateUserRequest {
  email: string;        // Valid email format
  name: string;         // 2-100 characters
  role: "admin" | "user"; 
  metadata?: Record<string, any>;
}

interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  status: "active" | "pending";
}
\`\`\`

## AUTHENTICATION
Bearer token required in Authorization header.
Token obtained from POST /auth/login

## ERROR CODES
- 400: Invalid request payload
- 401: Missing or invalid token
- 409: User with email already exists
- 429: Rate limit exceeded

Generate production-ready TypeScript code with:
- Full type safety
- Error handling with retries
- Input validation using Zod
- Unit tests with 90%+ coverage`,
    typescript: `import { z } from 'zod';

// Types generated from API schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(["admin", "user"]),
  metadata: z.record(z.any()).optional(),
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;

interface CreateUserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  status: "active" | "pending";
}

class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    // Validate input
    const validated = CreateUserSchema.parse(data);
    
    const response = await fetch(\`\${this.baseUrl}/api/v1/users\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${this.token}\`,
      },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message, response.status);
    }

    return response.json();
  }
}`,
    python: `from dataclasses import dataclass
from typing import Optional, Dict, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

@dataclass
class CreateUserRequest:
    email: str
    name: str
    role: str  # "admin" or "user"
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class CreateUserResponse:
    id: str
    email: str
    name: str
    role: str
    created_at: str
    status: str  # "active" or "pending"

class ApiClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        
        # Configure retries
        retries = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retries))
    
    def create_user(self, data: CreateUserRequest) -> CreateUserResponse:
        \"\"\"Create a new user account.\"\"\"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        payload = {
            "email": data.email,
            "name": data.name,
            "role": data.role,
            "metadata": data.metadata
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/users",
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        
        result = response.json()
        return CreateUserResponse(**result)`,
  };
  
  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
      {/* Window header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === "prompt" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            AI Prompt
          </button>
          <button
            onClick={() => setActiveTab("typescript")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === "typescript" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setActiveTab("python")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === "python" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Python
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Code content */}
      <div className="p-4 md:p-6 overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-slate-300 min-h-[300px]"
          >
            <TypewriterCode code={codeExamples[activeTab]} delay={200} />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-t border-slate-700 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>{activeTab === "prompt" ? "Markdown" : activeTab === "typescript" ? "TypeScript" : "Python"}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>Ready to use</span>
        </div>
      </div>
    </div>
  );
}

// Step card for how it works
function StepCard({ 
  number, 
  title, 
  description, 
  icon: Icon,
  delay = 0
}: { 
  number: number; 
  title: string; 
  description: string; 
  icon: any;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="flex gap-6 group"
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
          {number}
        </div>
        {number < 4 && (
          <div className="w-px h-full bg-gradient-to-b from-blue-500/50 to-transparent mt-4" />
        )}
      </div>
      <div className="pb-12">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const ySpring = useSpring(y, springConfig);

  const frameworks = [
    { name: "TypeScript", lang: ".ts" },
    { name: "JavaScript", lang: ".js" },
    { name: "React", lang: ".tsx" },
    { name: "Next.js", lang: ".ts" },
    { name: "Vue.js", lang: ".ts" },
    { name: "Python", lang: ".py" },
    { name: "Flutter", lang: ".dart" },
    { name: "Swift", lang: ".swift" },
    { name: "Kotlin", lang: ".kt" },
    { name: "Node.js", lang: ".ts" },
    { name: "cURL", lang: ".sh" },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Global styles */}
      <style jsx global>{`
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
          <Link href="/app" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <FileJson className="relative w-6 h-6 text-blue-400" />
            </div>
            <span className="font-bold text-lg">NexusDocer</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/docs" className="hidden md:block">
              <Button variant="ghost" size="sm">
                Browse Docs
              </Button>
            </Link>
            <Link href="https://github.com" target="_blank" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </Button>
            </Link>
            <Link href="/app">
              <Button size="sm" className="gap-2">
                <Zap className="w-4 h-4" />
                Launch App
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <GradientBackground />
        <ParticleNetwork />
        <FloatingSymbols />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div
          style={{ y: ySpring, opacity }}
          className="relative z-10 container px-4 mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-sm">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Zero AI Cost
              </Badge>
              <span className="text-muted-foreground">—</span>
              <span className="text-foreground font-medium">Rule-Based Engine</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
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
              <span className="block mb-2">API Documentation</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Made Intelligent
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Transform your Postman collections and Firestore schemas into 
              <span className="text-foreground font-medium"> interactive documentation</span>.
              Generate structured prompts and production-ready code for 
              <span className="text-foreground font-medium"> 10+ frameworks</span> — no AI APIs required.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/app">
                <Button size="lg" className="gap-2 text-base px-8 py-6 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow" style={{ animation: "pulse-glow 3s ease-in-out infinite" }}>
                  <Rocket className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6" asChild>
                <a href="#demo">
                  <Play className="w-5 h-5" />
                  See How It Works
                </a>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free Forever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No Credit Card
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Open Source
              </span>
            </motion.div>
          </div>

          {/* Hero visual - Code Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50" />
              <CodeDemo />
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

      {/* Stats Section */}
      <section className="relative py-20 border-y border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCounter value={10} suffix="+" label="Frameworks" />
            <StatCounter value={47} suffix="ms" label="Avg. Parse Time" />
            <StatCounter value={0} suffix="" label="AI API Costs" />
            <StatCounter value={100} suffix="%" label="Free & Open" />
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm mb-6"
            >
              <Layers className="w-4 h-4" />
              Everything You Need
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Powerful Features,
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Zero Complexity</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              From Postman collections to Firestore schemas, NexusDocer handles it all.
              One tool for all your API documentation needs.
            </motion.p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <BentoCard
              icon={FileJson}
              title="Postman Collections"
              description="Drag-and-drop your Postman export to get instant, beautiful documentation. No setup required."
              delay={0}
            />
            <BentoCard
              icon={Database}
              title="Firestore Schemas"
              description="Connect your Firebase project and automatically document collections, fields, and security rules."
              delay={0.1}
            />
            <BentoCard
              icon={Code2}
              title="Code Generation"
              description="Generate production-ready code snippets with proper types, error handling, and authentication."
              delay={0.2}
            />
            <BentoCard
              icon={Eye}
              title="Dual View Modes"
              description="Switch between Developer mode with technical details and User mode with clean, readable docs."
              delay={0.3}
            />
            <BentoCard
              icon={Bot}
              title="AI Prompt Generator"
              description="Generate structured prompts for Cursor, Copilot, or ChatGPT. Zero AI cost—pure rule-based magic."
              large
              delay={0.4}
            />
            <BentoCard
              icon={GitBranch}
              title="Flowcharts"
              description="Auto-generate Mermaid diagrams showing API flows and data relationships."
              delay={0.5}
            />
            <BentoCard
              icon={Play}
              title="API Playground"
              description="Test endpoints directly from the documentation. Send real HTTP requests and see responses."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="demo" className="relative py-32 overflow-hidden bg-gradient-to-b from-background via-blue-500/[0.02] to-background">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            {/* Left: Steps */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm mb-6"
              >
                <Workflow className="w-4 h-4" />
                How It Works
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold mb-8"
              >
                From Collection to
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Code in Seconds</span>
              </motion.h2>

              <div className="space-y-0">
                <StepCard
                  number={1}
                  icon={FileJson}
                  title="Upload Your Collection"
                  description="Drag and drop your Postman collection JSON export. No account required. Your data never leaves your browser unless you choose to publish."
                  delay={0}
                />
                <StepCard
                  number={2}
                  icon={Search}
                  title="Explore & Search"
                  description="Browse your API with an intuitive folder tree. Use fuzzy search (Cmd+K) to find endpoints instantly. Switch between Dev and User view modes."
                  delay={0.2}
                />
                <StepCard
                  number={3}
                  icon={Bot}
                  title="Generate Prompts & Code"
                  description="Select endpoints and generate structured AI prompts or framework-specific code. Choose from 10+ frameworks including TypeScript, Python, Flutter, and more."
                  delay={0.4}
                />
                <StepCard
                  number={4}
                  icon={Rocket}
                  title="Copy, Download, or Publish"
                  description="Copy code to clipboard, download as files, or publish documentation to the cloud for team sharing. Public or private—your choice."
                  delay={0.6}
                />
              </div>
            </div>

            {/* Right: Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:sticky lg:top-24"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
                <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl overflow-hidden">
                  {/* Demo header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">My API Collection</span>
                    </div>
                    <Badge variant="outline" className="text-xs">12 folders • 47 endpoints</Badge>
                  </div>
                  
                  {/* Demo content */}
                  <div className="p-4 space-y-3">
                    {/* Folder */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-blue-400">Authentication</span>
                        <Badge variant="secondary" className="text-xs">3</Badge>
                      </div>
                      <div className="pl-6 space-y-1">
                        {["POST /auth/login", "POST /auth/register", "POST /auth/refresh"].map((endpoint) => (
                          <div key={endpoint} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer group">
                            <span className="text-xs font-mono text-green-400">POST</span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{endpoint.split(" ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Folder */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-blue-400">Users</span>
                        <Badge variant="secondary" className="text-xs">5</Badge>
                      </div>
                      <div className="pl-6 space-y-1">
                        {["GET /users", "GET /users/:id", "POST /users", "PUT /users/:id", "DELETE /users/:id"].map((endpoint) => (
                          <div key={endpoint} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer group">
                            <span className={`text-xs font-mono ${endpoint.startsWith("GET") ? "text-blue-400" : endpoint.startsWith("POST") ? "text-green-400" : endpoint.startsWith("PUT") ? "text-yellow-400" : "text-red-400"}`}>
                              {endpoint.split(" ")[0]}
                            </span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{endpoint.split(" ")[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Demo action bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">3 endpoints selected</span>
                    </div>
                    <Button size="sm" className="gap-1">
                      <Code2 className="w-4 h-4" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Frameworks Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm mb-6"
            >
              <Code2 className="w-4 h-4" />
              Framework Support
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Generate Code for
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> Any Stack</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              Production-ready code snippets with types, error handling, and authentication.
              Copy, paste, and ship.
            </motion.p>
          </div>

          {/* Framework badges */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {frameworks.map((fw, i) => (
              <FrameworkBadge key={fw.name} {...fw} delay={i * 0.05} />
            ))}
          </div>

          {/* Code preview cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            {[
              { 
                title: "Type Safe", 
                desc: "Full TypeScript definitions with Zod validation",
                icon: Shield,
                color: "blue"
              },
              { 
                title: "Error Handling", 
                desc: "Comprehensive try/catch with meaningful messages",
                icon: CheckCircle,
                color: "green"
              },
              { 
                title: "Auth Ready", 
                desc: "Built-in Bearer token and Firebase auth support",
                icon: Lock,
                color: "purple"
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose NexusDocer */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-background via-purple-500/[0.02] to-background">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm mb-6">
                <Flame className="w-4 h-4" />
                Why NexusDocer
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Documentation That
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> Actually Works</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We built NexusDocer because we were tired of outdated API docs, scattered Postman collections, 
                and tools that charged for AI features we didn't need.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: "Zero AI Cost",
                    desc: "Rule-based engine generates perfect prompts and code without expensive AI API calls."
                  },
                  {
                    icon: Globe,
                    title: "Works Offline",
                    desc: "Your data never leaves your browser. No internet required after page load."
                  },
                  {
                    icon: RefreshCw,
                    title: "Always Up-to-Date",
                    desc: "Documentation updates instantly when you upload a new collection."
                  },
                  {
                    icon: Cloud,
                    title: "Optional Cloud",
                    desc: "Publish to share with your team, or keep everything local. Your choice."
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-card/80 backdrop-blur border border-border/50 rounded-2xl p-6 space-y-4">
                {/* Comparison table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <span className="font-semibold">Feature</span>
                    <div className="flex gap-8">
                      <span className="text-sm text-muted-foreground w-20 text-center">Others</span>
                      <span className="text-sm font-medium text-orange-400 w-20 text-center">NexusDocer</span>
                    </div>
                  </div>
                  {[
                    { feature: "AI Code Generation", others: "$10-50/month", nexus: "Free", check: true },
                    { feature: "Postman Import", others: "Limited", nexus: "Full Support", check: true },
                    { feature: "Firestore Support", others: "❌", nexus: "✅ Built-in", check: true },
                    { feature: "Offline Mode", others: "❌", nexus: "✅", check: true },
                    { feature: "Open Source", others: "❌", nexus: "✅", check: true },
                    { feature: "API Playground", others: "⚠️ Limited", nexus: "✅ Full", check: true },
                  ].map((row, i) => (
                    <motion.div
                      key={row.feature}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-sm">{row.feature}</span>
                      <div className="flex gap-8">
                        <span className="text-sm text-muted-foreground w-20 text-center">{row.others}</span>
                        <span className={`text-sm font-medium w-20 text-center ${row.check ? "text-green-400" : ""}`}>{row.nexus}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid Detailed */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10 px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Every Feature You
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Could Want</span>
            </motion.h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={FileJson}
              title="Postman Import"
              description="Drag-and-drop JSON exports. Instant parsing with full v2.1 spec support."
              delay={0}
              color="blue"
            />
            <FeatureCard
              icon={Database}
              title="Firestore Integration"
              description="Connect Firebase, scan schemas, document security rules and indexes."
              delay={0.1}
              color="purple"
            />
            <FeatureCard
              icon={ScanEye}
              title="Dual View Modes"
              description="Developer mode with raw details or User mode with clean explanations."
              delay={0.2}
              color="green"
            />
            <FeatureCard
              icon={Command}
              title="Fuzzy Search"
              description="Cmd+K to search endpoints, folders, and collections instantly."
              delay={0.3}
              color="orange"
            />
            <FeatureCard
              icon={GitBranch}
              title="Flowcharts"
              description="Auto-generated Mermaid diagrams for API flows and relationships."
              delay={0.4}
              color="pink"
            />
            <FeatureCard
              icon={BookOpen}
              title="Markdown Export"
              description="Export full collections, folders, or single endpoints as Markdown."
              delay={0.5}
              color="blue"
            />
            <FeatureCard
              icon={Play}
              title="API Playground"
              description="Test endpoints with real HTTP requests. CORS proxy included."
              delay={0.6}
              color="green"
            />
            <FeatureCard
              icon={Cloud}
              title="Publish & Share"
              description="Cloud publishing with public or private visibility. Team sharing made easy."
              delay={0.7}
              color="purple"
            />
            <FeatureCard
              icon={Moon}
              title="Dark/Light Theme"
              description="System-aware theming with manual toggle. Easy on the eyes."
              delay={0.8}
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-500/5 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[128px]" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Free Forever • Open Source • No AI Costs</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                API Documentation?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of developers who have already made the switch. 
              Your documentation workflow will never be the same.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="gap-2 text-base px-10 py-7 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105">
                  <Rocket className="w-5 h-5" />
                  Launch NexusDocer
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 text-base px-10 py-7" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5" />
                  View on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free Forever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Open Source
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Zero AI Costs
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/app" className="flex items-center gap-2 mb-4">
                <FileJson className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-xl">NexusDocer</span>
              </Link>
              <p className="text-muted-foreground mb-4 max-w-sm">
                API & Database documentation made simple. Transform Postman collections 
                and Firestore schemas into interactive docs with zero AI costs.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/app" className="hover:text-foreground transition-colors">Launch App</Link></li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Browse Docs</Link></li>
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#demo" className="hover:text-foreground transition-colors">How It Works</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 NexusDocer. Built for developers, by developers.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/app" className="hover:text-foreground transition-colors">App</Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
