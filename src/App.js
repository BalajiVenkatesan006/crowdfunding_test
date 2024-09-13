import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import oraclaseLogo from './oraclase_logo_black_bg.png';
import { FaInstagram, FaLinkedin, FaYoutube, FaTiktok } from 'react-icons/fa';
import { Box, Typography, IconButton, Modal, Button, Container } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';  

// Define the custom theme based on Oraclase's website style
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
        footerBackground: {
            main: '#212529',  // Color from Oraclase footer
        },
        text: {
            primary: '#ffffff',  // Set to white for footer and other text areas
        },
    },
    typography: {
        fontFamily: '"Inter", sans-serif',  // Use "Inter" as per Oraclase's site
        h6: {
            fontSize: '1.1rem',  // Adjust heading font sizes
            fontWeight: 'bold',
        },
        body1: {
            fontSize: '0.9rem',  // Adjust body font sizes as per Oraclase site
        },
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

const clearLocalStorage = () => {
    localStorage.removeItem('thumbnails');
    localStorage.removeItem('currentImage');
    for (let i = 0; i < 4; i++) {
        localStorage.removeItem(`image_${i}`);
    }
};

const App = () => {
    const [isConsentGiven, setIsConsentGiven] = useState(null);
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

    const store = process.env.REACT_APP_STORE;

    useEffect(() => {
        clearLocalStorage();
        if (store === 'yes') {
            const consent = localStorage.getItem('userConsent');
            if (consent === null) {
                setIsConsentModalOpen(true);
            } else {
                setIsConsentGiven(true);
            }
        } else {
            setIsConsentGiven(true);
        }
    }, [store]);

    const handleConsent = () => {
        localStorage.setItem('userConsent', true);
        setIsConsentGiven(true);
        setIsConsentModalOpen(false);
    };

    const handleDisagree = () => {
        localStorage.setItem('userConsent', false);
        setIsConsentModalOpen(false);
    };

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <ThemeProvider theme={theme}>
            <Box sx={styles.appContainer}>
                {store === 'yes' && isConsentModalOpen && (
                    <Modal open={isConsentModalOpen}>
                        <Box
                            sx={{
                                ...styles.modalContent,
                                width: isMobile ? '90%' : '500px',
                                padding: isMobile ? '20px' : '40px',
                            }}
                        >
                            <Typography variant="h6" component="h2">
                                Consent Required
                            </Typography>
                            <Typography sx={styles.consentText}>
                                We require your consent to process and store the images you upload. 
                                By agreeing, you acknowledge that the images will be used for personalized product creation, 
                                stored securely, and processed in accordance with GDPR Article 6(1)(a). 
                                <br /><br />
                                You certify that you own the rights to the uploaded images and that no third-party rights are infringed.
                                You can revoke your consent at any time, with future effect, as per GDPR Article 7(3).
                            </Typography>
                            <Box sx={styles.consentButtonGroup}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleConsent}
                                    sx={styles.consentButton}
                                >
                                    I Agree
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleDisagree}
                                    sx={styles.consentButton}
                                >
                                    Disagree
                                </Button>
                            </Box>
                        </Box>
                    </Modal>
                )}

                {localStorage.getItem('userConsent') != null && (
                    <>
                        <Box sx={styles.header}>
                            <img src={oraclaseLogo} alt="Oraclase Logo" style={styles.logo} />
                            <Box sx={styles.socialIcons}>
                                <IconButton component="a" href="https://www.instagram.com/oraclase.ai/" target="_blank">
                                    <FaInstagram size={20} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.linkedin.com/company/oraclase/" target="_blank">
                                    <FaLinkedin size={20} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.youtube.com/@Oraclase" target="_blank">
                                    <FaYoutube size={20} style={{ color: 'white' }} />
                                </IconButton>
                                <IconButton component="a" href="https://www.tiktok.com/@oraclase.ai" target="_blank">
                                    <FaTiktok size={20} style={{ color: 'white' }} />
                                </IconButton>
                            </Box>
                        </Box>
                        <Container sx={styles.mainContent} maxWidth="lg">
                            <ImageUploader />
                        </Container>
                        <Box sx={styles.footer}>
                            <Typography sx={styles.footerText}>
                                Oraclase | Saarland Informatics Campus | Campus E1 7 (MMCI) | 66123 Saarbrücken, Germany
                            </Typography>
                            <Typography sx={styles.footerText}>
                                +49 (0) 681 302 707 61 | info@oraclase.com
                            </Typography>
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
        padding: '5px 20px',  // Reduced padding to match smaller header
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '6vh',  // Reduced header height (50% of original)
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    logo: {
        height: '80%',  // Adjusted logo height for smaller header
    },
    socialIcons: {
        display: 'flex',
        gap: '10px',  // Reduced gap between icons for smaller header
    },
    mainContent: {
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '6vh',  // Adjusted for smaller header
        paddingBottom: '18vh',
        marginTop: '4vh',  // Adjusted to account for header
        backgroundColor: theme.palette.background.default,
    },
    footer: {
        backgroundColor: theme.palette.footerBackground.main,  // Set to footer color from Oraclase
        color: theme.palette.text.primary,
        padding: '20px',
        textAlign: 'center',
        height: '8vh',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    footerText: {
        fontFamily: theme.typography.fontFamily,
        fontSize: '0.9rem',  // Adjusted font size to match Oraclase's style
        color: theme.palette.text.primary,
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
    consentText: {
        marginTop: '20px',
        textAlign: 'justify',
        lineHeight: '1.5',
    },
    consentButtonGroup: {
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    consentButton: {
        padding: '10px 20px',
        fontSize: '1.1em',
        borderRadius: '25px',
        width: '45%',
    },
};

export default App;
