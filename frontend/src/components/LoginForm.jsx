import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'medisure' && password === 'medisure@2026') {
            localStorage.setItem('isLoggedIn', 'true');
            navigate('/home');
        } else {
            setError('Invalid credentials for Medisure Node');
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6 max-w-sm w-full">
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan w-5 h-5" />
                <input
                    type="text"
                    placeholder="Operator ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-none focus:border-neon-cyan transition-colors"
                />
            </div>

            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan w-5 h-5" />
                <input
                    type="password"
                    placeholder="Access Code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl focus:outline-none focus:border-neon-cyan transition-colors"
                />
            </div>

            {error && <p className="text-red-400 text-sm text-center font-medium animate-shake">{error}</p>}

            <button className="w-full bg-neon-cyan text-black font-bold p-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                Initialize Connection
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </form>
    );
};

export default LoginForm;
