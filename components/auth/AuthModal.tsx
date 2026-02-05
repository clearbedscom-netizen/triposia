'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'register';
  callbackUrl?: string;
}

export default function AuthModal({ 
  open, 
  onClose, 
  initialTab = 'signin',
  callbackUrl 
}: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'register'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sign in fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Registration fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'signin' | 'register') => {
    setTab(newValue);
    setError('');
    setSuccess(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const url = callbackUrl || window.location.pathname;
      // Google OAuth requires a full page redirect
      // The modal will be closed when the page redirects
      await signIn('google', { callbackUrl: url });
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Auto sign in after successful registration
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: registerEmail,
          password: registerPassword,
          redirect: false,
        });

        if (result?.ok) {
          onClose();
          router.refresh();
        } else {
          setError('Registration successful! Please sign in.');
          setLoading(false);
          setTab('signin');
        }
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    setSignInEmail('');
    setSignInPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" component="span">
          {tab === 'signin' ? 'Sign In' : 'Create Account'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {tab === 'signin' ? 'Signed in successfully!' : 'Account created successfully! Signing you in...'}
          </Alert>
        )}

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab 
            label="Sign In" 
            value="signin" 
            icon={<LoginIcon />} 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Register" 
            value="register" 
            icon={<PersonAddIcon />} 
            iconPosition="start"
            sx={{ textTransform: 'none' }}
          />
        </Tabs>

        {/* Google Sign In Button */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{
            mb: 3,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Sign In Form */}
        {tab === 'signin' && (
          <Box component="form" onSubmit={handleSignIn}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type={showSignInPassword ? 'text' : 'password'}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showSignInPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !signInEmail || !signInPassword}
              sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        )}

        {/* Registration Form */}
        {tab === 'register' && (
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Full Name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
              margin="normal"
              autoComplete="name"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type={showRegisterPassword ? 'text' : 'password'}
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              disabled={loading}
              helperText="Must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !registerName || !registerEmail || !registerPassword || !confirmPassword}
              sx={{ mt: 3, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
