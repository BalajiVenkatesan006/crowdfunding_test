import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import oraclaseLogo from './oraclase_logo_black_bg.png';
import { FaInstagram, FaLinkedin, FaYoutube, FaTiktok } from 'react-icons/fa';
import { Box, Typography, IconButton, Modal, Button, Container, Link } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#0d47a1',
        },
        secondary: {
            main: '#d32f2f',
        },
        background: {
            default: '#f7f7f7',
        },
    },
    typography: {
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '25px',
                },
            },
        },
    },
});

const App = () => {
    const [isConsentGiven, setIsConsentGiven] = useState(false);

    const handleConsent = () => {
        setIsConsentGiven(true);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={styles.appContainer}>
                {!isConsentGiven && (
                    <Modal open={!isConsentGiven}>
                        <Box sx={styles.modalContent}>
                            <Typography variant="h6" component="h2">
                                Consent Required
                            </Typography>
                            <Typography sx={{ mt: 2 }}>
                            I agree that the images I upload may be stored and processed by Oraclase in accordance with Art. 6 para. 1 lit. a of the Datenschutz-Grundverordnung (DSGVO) for the creation of personalized products and their preview. I certify that I own the rights to the uploaded images and that no rights of third parties are infringed by their use. I am informed that I can revoke my consent in accordance with Art. 7 para. 3 DSGVO at any time with effect for the future.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConsent}
                                sx={styles.consentButton}
                            >
                                I Agree
                            </Button>
                        </Box>
                    </Modal>
                )}
                {isConsentGiven && (
                    <>
                        <Box sx={styles.header}>
                            <img src={oraclaseLogo} alt="Oraclase Logo" style={styles.logo} />
                            <Box sx={styles.socialIcons}>
                                <IconButton component="a" href="https://www.instagram.com/oraclase.ai/" target="_blank">
                                    <FaInstagram size={24} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.linkedin.com/company/oraclase/" target="_blank">
                                    <FaLinkedin size={24} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.youtube.com/@Oraclase" target="_blank">
                                    <FaYoutube size={24} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.tiktok.com/@oraclase.ai" target="_blank">
                                    <FaTiktok size={24} style={{ color: 'white' }} />
                                </IconButton>
                            </Box>
                        </Box>
                        <Container sx={styles.mainContent} maxWidth="lg">
                            <ImageUploader />
                        </Container>
                        <Box sx={styles.footer}>
                            <Typography>
                                Oraclase | Saarland Informatics Campus | Campus E1 7 (MMCI) | 66123 Saarbrücken, Germany
                            </Typography>
                            <Typography>+49 (0) 681 302 707 61 | info@oraclase.com</Typography>
                        </Box>
                    </>
                )}
            </Box>
        </ThemeProvider>
    );
};

const styles = {
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
    },
    header: {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '8vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    logo: {
        height: '100%',
    },
    socialIcons: {
        display: 'flex',
        gap: '20px',
    },
    mainContent: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '10vh',
        paddingBottom: '8vh',
        marginTop: '8vh',
        backgroundColor: theme.palette.background.default,
    },
    footer: {
        backgroundColor: theme.palette.primary.dark,
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        height: '8vh',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    modalContent: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: 24,
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
    },
    consentButton: {
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '1.1em',
        borderRadius: '25px',
    },
};

export default App;
