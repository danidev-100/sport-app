import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const JugadorLogin = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = (credentialResponse) => {
    console.log('Google login success', credentialResponse);
  };

  const handleGoogleError = () => {
    console.log('Google login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/Logo club coop beltrán.svg"
            alt="Club"
            className="w-20 h-20 mx-auto mb-4 object-contain"
          />
          <CardTitle className="text-primary text-2xl">Club Deportivo</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Ingresá con Google para ver tus cuotas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
        </CardContent>
        <CardContent className="text-center pt-0">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Panel Administrativo
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JugadorLogin;
