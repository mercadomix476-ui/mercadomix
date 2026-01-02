
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Eye, EyeOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SuccessAnimation } from "@/components/ui/feedback";
import { SystemLogo } from "@/components/ui/LogoDisplay";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        setLoginSuccess(true);
        // Aguardar um pouco para mostrar a animação e garantir que o AuthContext processe
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      } else {
        setError(result.error || "E-mail ou senha inválidos. Verifique e tente novamente.");
      }
    } catch (err) {
      setError("E-mail ou senha inválidos. Verifique e tente novamente.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <motion.main 
        className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-lg" 
        role="main"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="text-center">
          <motion.div 
            className="inline-block mb-4"
            role="img"
            aria-label="Logo do Nexus Commerce"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <SystemLogo
              size="xlarge"
              className="mx-auto"
            />
          </motion.div>
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-slate-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Nexus Commerce
          </motion.h1>
          <motion.p 
            className="text-slate-500 text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Acesse o Ponto de Venda
          </motion.p>
        </header>

        <AnimatePresence>
          {loginSuccess ? (
            <SuccessAnimation show={loginSuccess}>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                </div>
                <p className="text-emerald-600 font-semibold">Login realizado com sucesso!</p>
                <p className="text-slate-500 text-sm mt-1">Redirecionando...</p>
              </div>
            </SuccessAnimation>
          ) : (
            <motion.form 
              onSubmit={handleLogin} 
              className="space-y-6" 
              noValidate
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-600"
                >
                  E-mail *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                  aria-describedby={error ? "login-error" : undefined}
                  aria-invalid={error ? "true" : "false"}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-600"
                >
                  Senha *
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pr-12 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                    aria-describedby={error ? "login-error" : undefined}
                    aria-invalid={error ? "true" : "false"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert variant="destructive" role="alert">
                      <AlertDescription id="login-error" className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 text-base sm:text-lg bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-describedby={loading ? "login-status" : undefined}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" className="text-white" />
                    <span id="login-status">Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.main>
      
      <motion.footer 
        className="mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500 text-center px-4" 
        role="contentinfo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        © {new Date().getFullYear()} Nexus Commerce. Todos os direitos reservados.
      </motion.footer>
    </div>
  );
}
