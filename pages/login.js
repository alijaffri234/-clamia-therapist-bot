import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      alert(result.error);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6faff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: 'system-ui, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center', borderTop: '4px solid #7E3AED' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ marginTop: '0', marginBottom: '8px', fontSize: '24px', fontWeight: 'bold', color: '#232323' }}>
            Welcome back
          </h2>
          <p style={{ marginTop: '0', fontSize: '14px', color: '#6b7a90' }}>
            Sign in to your account
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#232323', marginBottom: '4px' }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: 'calc(100% - 24px)', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e3e6ea', fontSize: '15px', background: '#fff' }}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#232323', marginBottom: '4px' }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: 'calc(100% - 24px)', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e3e6ea', fontSize: '15px', background: '#fff' }}
              placeholder="Enter your password"
            />
          </div>

          <div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#7E3AED',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-in-out',
              }}
            >
              Sign in
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '14px', marginTop: '16px' }}>
            <Link href="/register" style={{ color: '#7E3AED', textDecoration: 'none' }}>
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage; 