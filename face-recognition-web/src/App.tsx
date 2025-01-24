import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  Stack,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Fade,
  useTheme,
  Avatar
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  CameraAlt,
  HowToReg,
  Login,
  PersonAdd,
  Security,
  Face,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const StyledWebcam = styled(Webcam)(({ theme }) => ({
  width: '100%',
  height: 'auto',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  animation: `${pulseAnimation} 2s infinite`,
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)'
  }
}));

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  registeredAt: string;
  lastAuthenticated: string | null;
}

function App() {
  const theme = useTheme();
  const webcamRef = useRef<Webcam>(null);
  const [mode, setMode] = useState<'register' | 'authenticate'>('authenticate');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      return imageSrc;
    }
    return null;
  }, [webcamRef]);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const imageSrc = capture();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      const response = await fetch('http://192.168.1.9:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc,
          ...formData
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Inscription reussie. Vous pouvez maintenant vous authentifier.'
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          department: ''
        });
        // Basculer automatiquement vers le mode authentification après une inscription réussie
        setMode('authenticate');
      } else {
        // Gestion spécifique des erreurs d'email
        if (data.detail && data.detail.includes('email address is already registered')) {
          setMessage({
            type: 'error',
            text: 'Cette adresse email est déjà utilisée. Veuillez en choisir une nouvelle.'
          });
          // Focus sur le champ email pour faciliter la correction
          const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
          if (emailInput) {
            emailInput.focus();
          }
        } else {
          throw new Error(data.detail || 'Registration failed');
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred during registration'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setAuthenticatedUser(null);
      
      const imageSrc = capture();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      const response = await fetch('http://192.168.1.9:8000/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.matched) {
          setMessage({
            type: 'success',
            text: `Authentication successful! Confidence: ${(data.confidence * 100).toFixed(2)}%`
          });
          setAuthenticatedUser(data.user);
        } else {
          setMessage({
            type: 'error',
            text: 'Visage non reconnu'
          });
        }
      } else {
        throw new Error(data.detail || 'Authentication failed');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        background: 'linear-gradient(135deg, #1a237e 0%, #0277bd 50%, #00838f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'hidden',
      }}
    >
      <Container maxWidth="md" sx={{ 
        mt: 4,
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Fade in timeout={1000}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography
                component="h1"
                variant="h2"
                align="center"
                color="white"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                  mb: 3,
                  width: '100%',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  letterSpacing: '0.02em',
                  lineHeight: 1.2
                }}
              >
                Système de reconnaissance faciale
              </Typography>
              <Typography
                variant="h6"
                align="center"
                color="white"
                paragraph
                sx={{
                  opacity: 0.9,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  mb: 6,
                  width: '100%'
                }}
              >
                Authentification sécurisée avec reconnaissance faciale avancée
              </Typography>
            </Grid>

            <Grid item xs={12} container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 3, borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                  <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Button
                      variant={mode === 'authenticate' ? 'contained' : 'outlined'}
                      onClick={() => setMode('authenticate')}
                      startIcon={<Login />}
                      fullWidth
                    >
                      Authenticate
                    </Button>
                    <Button
                      variant={mode === 'register' ? 'contained' : 'outlined'}
                      onClick={() => setMode('register')}
                      startIcon={<PersonAdd />}
                      fullWidth
                    >
                      Register
                    </Button>
                  </Box>

                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <StyledWebcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      mirrored
                    />
                    {loading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          borderRadius: '16px'
                        }}
                      >
                        <Typography variant="h6" color="white">
                          Traitement en cours...
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {mode === 'register' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleFormChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleFormChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleFormChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleFormChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={mode === 'register' ? handleRegister : handleAuthenticate}
                      disabled={loading || (mode === 'register' && Object.values(formData).some(v => !v))}
                      startIcon={mode === 'register' ? <HowToReg /> : <Security />}
                      sx={{
                        py: 1.5,
                        backgroundColor: mode === 'register' ? '#2e7d32' : '#1976d2',
                        '&:hover': {
                          backgroundColor: mode === 'register' ? '#1b5e20' : '#1565c0',
                        },
                      }}
                    >
                      {mode === 'register' ? 'Register' : 'Authentificate'}
                    </Button>
                  </Box>

                  {message && (
                    <Fade in timeout={500}>
                      <Alert
                        severity={message.type}
                        icon={message.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
                        sx={{
                          mt: 2,
                          borderRadius: '12px',
                          alignItems: 'center',
                        }}
                      >
                        {message.text}
                      </Alert>
                    </Fade>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Fade in={!!authenticatedUser} timeout={800}>
                  <Box>
                    {authenticatedUser ? (
                      <Paper sx={{ padding: 3, borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)', border: '1px solid rgba(255, 255, 255, 0.18)', height: '100%' }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                          <Avatar sx={{ mx: 'auto', mb: 2, width: 80, height: 80, fontSize: '2.5rem', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)', border: '4px solid white' }}>
                            {authenticatedUser.firstName[0]}{authenticatedUser.lastName[0]}
                          </Avatar>
                          <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            {authenticatedUser.firstName} {authenticatedUser.lastName}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ color: 'text.secondary', mt: 1 }}
                          >
                            {authenticatedUser.department}
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton size="small" sx={{ mr: 1, color: 'primary.main' }}>
                                <Security />
                              </IconButton>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                <strong>Email:</strong> {authenticatedUser.email}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton size="small" sx={{ mr: 1, color: 'success.main' }}>
                                <HowToReg />
                              </IconButton>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                <strong>Enregistré:</strong>{' '}
                                {new Date(authenticatedUser.registeredAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                          {authenticatedUser.lastAuthenticated && (
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton size="small" sx={{ mr: 1, color: 'info.main' }}>
                                  <Login />
                                </IconButton>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  <strong>Dernière Authentication:</strong>{' '}
                                  {new Date(authenticatedUser.lastAuthenticated).toLocaleString()}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Paper>
                    ) : mode === 'authenticate' && (
                      <Paper sx={{ padding: 3, borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                            Bienvenue sur Face Authentication
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Positionnez votre visage devant la caméra et cliquez sur le bouton "S'authentifier".
                            Votre identité sera vérifiée contre notre base de données securisée.
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </Fade>
              </Grid>
            </Grid>
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
}

export default App;
