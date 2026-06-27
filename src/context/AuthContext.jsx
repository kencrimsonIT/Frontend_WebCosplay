import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("accessToken");
        
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
            }
        }
        setLoading(false);
    }, []);

    const loginUser = (userData, token) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", token);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logoutUser = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, updateUser, logoutUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
