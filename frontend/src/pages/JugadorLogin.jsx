import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const JugadorLogin = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google login success', credentialResponse);
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-slide-up glass-strong shadow-lg">
        <CardHeader className="text-center pb-0">
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
          <p className="text-sm text-muted-foreground mt-2">
            Ingresá con Google para ver tus cuotas
          </p>
        </CardHeader>

        <CardContent className="pt-8 pb-4 space-y-6">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              shape="pill"
              text="signin_with"
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Panel Administrativo
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JugadorLogin;
