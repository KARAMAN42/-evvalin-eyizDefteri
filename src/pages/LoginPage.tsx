import { Eye, EyeOff, Heart, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { await signIn(email.trim(), password); } catch { setError('E-posta veya şifre hatalı. Lütfen tekrar dene.'); } finally { setLoading(false); } }
  return <main className="login-root"><section className="login-card"><div className="login-logo"><Heart fill="currentColor" /></div><h1>Çeyiz Defterim</h1><p>Hesabınla giriş yap ve hazırlıklara devam et</p><form onSubmit={submit}>
    <label>E-posta<div className="input-icon"><Mail /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" required /></div></label>
    <label>Şifre<div className="input-icon"><Lock /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Şifreyi göster">{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
    {error && <div className="form-error" role="alert">{error}</div>}<button className="btn-primary login-button" type="submit" disabled={loading || !email || !password}>✦ {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}</button>
  </form><small>Sevgiyle hazırlandı ♥ Çeyiz Defterim</small></section></main>;
}
