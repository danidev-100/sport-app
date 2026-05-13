import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-slide-up glass-strong shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-5 flex items-center justify-center ring-1 ring-primary/20 shadow-glow">
            <img
              src="/Logo club coop beltrán.svg"
              alt="Club"
              className="w-11 h-11 object-contain"
            />
          </div>
          <CardTitle className="text-xl">
            Club <span className="gradient-text">Deportivo</span>
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Iniciar sesión en el panel administrativo
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5">
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-10 gap-2" disabled={isSubmitting}>
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-6">
          <Link
            to="/register"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ¿No tenés cuenta? <span className="text-primary hover:underline">Registrate</span>
          </Link>
          <Link
            to="/jugador-login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-primary hover:underline">Soy jugador</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
