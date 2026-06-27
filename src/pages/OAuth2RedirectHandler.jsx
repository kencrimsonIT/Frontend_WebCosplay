import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/auth_api';

function OAuth2RedirectHandler() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (token) {
            localStorage.setItem('accessToken', token);
            
            // Fetch user info using the token
            getCurrentUser()
                .then(user => {
                    loginUser(user, token);
                    if (user.role === 'ADMIN') {
                        navigate('/admin');
                    } else if (user.role === 'SELLER') {
                        navigate('/seller/manage-inventory');
                    } else {
                        navigate('/');
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch user info after OAuth2", err);
                    navigate('/?error=' + encodeURIComponent(err));
                });
        } else if (error) {
            navigate('/?error=' + encodeURIComponent(error));
        } else {
            navigate('/');
        }
    }, [location, navigate, loginUser]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            color: 'var(--text-primary)' 
        }}>
            <h2>Đang xác thực...</h2>
        </div>
    );
}

export default OAuth2RedirectHandler;