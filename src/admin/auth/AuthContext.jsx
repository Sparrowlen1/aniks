import { createContext, useContext, useEffect, useState } from "react"
import { loginRequest } from "../utils/auth";


const AuthContext = createContext(null);
const STORAGE_KEY = 'anika_admin_session';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const { user: storedUser, token: storedToken } = JSON.parse(stored);
                setUser(storedUser);
                setToken(storedToken);
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);


    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setToken(null);
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    })

    const login = async (email, password) => {
        const { user: account, accessToken, refreshToken } = await loginRequest({ email, password });
        setUser(account);
        setToken(accessToken);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: account, token: accessToken, refreshToken }));
        return account;
    };

    const updateUser = (patch) => {
        setUser((prev) => {
            const next = { ...prev, ...patch };
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user: next }));
                } catch {
                    // corrupted session -- next login will rebuild it cleanly
                }
            }
            return next;
        });
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
        // Hard navigation (not React Router) so the app re-boots from scratch on
        // next sign-in — access.js/nav.js compute their role-access matrix once
        // per page load, so a plain state clear would leave saved Roles & Access
        // changes invisible until an unrelated manual refresh.
        window.location.href = '/admin/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
  );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
