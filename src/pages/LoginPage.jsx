import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Login, Eye, EyeSlash } from 'iconsax-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (!success) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/image.png" alt="Logo" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            <Login size={20} variant="Bold" />
            <span>{loading ? 'Cargando...' : 'Entrar al Sistema'}</span>
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .login-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          color: #fff;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #8C8C8C;
          text-transform: uppercase;
        }
        .form-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 15px;
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s;
        }
        .form-group input:focus {
          border-color: #F2CB05;
          background: rgba(255, 255, 255, 0.1);
        }
        .password-input {
          position: relative;
          display: flex;
        }
        .password-input input {
          width: 100%;
          padding-right: 45px;
        }
        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .login-error {
          color: #e74c3c;
          font-size: 0.85rem;
          text-align: center;
          background: rgba(231, 76, 60, 0.1);
          padding: 10px;
          border-radius: 8px;
        }
        .login-btn {
          background: #F2CB05;
          color: #0D0D0D;
          border: none;
          padding: 14px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          margin-top: 10px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(242, 203, 5, 0.3);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
