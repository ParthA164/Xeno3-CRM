import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Container,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, error, isLoading, clearError, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Check for token in URL parameters (from Google OAuth callback)
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (token) {
      login(token);
    } else if (errorParam) {
      setLoginError(decodeURIComponent(errorParam));
    }
  }, [searchParams, login]);

  useEffect(() => {
    // Navigate to dashboard if user is authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  const handleGoogleLogin = () => {
    clearError();
    setLoginError(null);
    
    // Redirect to backend Google OAuth endpoint
    const googleAuthUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
    window.location.href = googleAuthUrl;
  };

  const handleDemoLogin = async () => {
    clearError();
    setLoginError(null);
    
    try {
      // Call the demo login API
      const response = await authAPI.demoLogin();
      
      if (response.data.success && response.data.data && response.data.token) {
        // Use the login function from auth context with the token from API
        await login(response.data.token);
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      setLoginError('Demo login failed. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 20px 25px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              py: 4,
              px: 3,
              textAlign: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <CampaignIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom>
              Mini CRM Platform
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Customer segmentation, personalized campaigns, and intelligent insights
            </Typography>
          </Box>
          
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 3 }}>
              Welcome Back
            </Typography>

            {(loginError || error) && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                onClose={() => {
                  setLoginError(null);
                  clearError();
                }}
              >
                {loginError || error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  backgroundColor: '#db4437',
                  '&:hover': {
                    backgroundColor: '#c23321',
                  },
                }}
              >
                Continue with Google
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                variant="outlined"
                size="large"
                onClick={handleDemoLogin}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Try Demo Account
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Box>

            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Features included:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  Customer data management & segmentation
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  AI-powered campaign creation
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Real-time delivery tracking
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Performance analytics & insights
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
