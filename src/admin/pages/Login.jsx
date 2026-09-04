import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";


export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);
      try {
        await login(email, password);
        const redirectTo = location.state?.from?.pathname || '/admin';
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setError(err.message || 'Invalid email or password');
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <img src="/anika-logo.png" alt="ANIKA" className="w-10 h-10" />
          <span className="font-display text-2xl text-ink tracking-wide">ANIKA ADMIN</span>
        </div>

        <div className="flex h-1.5 w-full mb-10 overflow-hidden rounded-full">
          <div className="flex-1 bg-coral" />
          <div className="flex-1 bg-anika-green" />
          <div className="flex-1 bg-gold" />
          <div className="flex-1 bg-anika-blue" />
        </div>

        <h1 className="font-display text-4xl text-ink mb-3">SIGN IN</h1>
        <p className="font-body text-ink/60 mb-8">
          Enter your details to access your workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-body text-xs font-semibold tracking-wide text-ink/70 uppercase mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 font-body text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-anika-blue"
              placeholder="you@anikainitiative.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-body text-xs font-semibold tracking-wide text-ink/70 uppercase mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 pr-11 font-body text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-anika-blue"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>


          {/* TODO: Forgot password logic flow  */}
          {/* <div className="flex justify-end">
            <Link to="/admin/forgot-password" className="font-body text-sm text-anika-blue hover:underline">
              Forgot password?
            </Link>
          </div> */}

          {error && <p className="font-body text-sm text-coral">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-ink py-3 font-display tracking-wide text-cream disabled:opacity-50"
          >
            {isSubmitting ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  )
}
