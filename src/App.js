import React, { useState, useEffect } from 'react';
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
    const [isConsentGiven, setIsConsentGiven] = useState(null);
    const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

    // Fetch the store variable from environment variables
    const store = process.env.REACT_APP_STORE;

    useEffect(() => {
        // If store === 'yes', show the consent modal, otherwise load the content without showing consent
        console.log("The storage variable");
        console.log(store);
        console.log(process.env.REACT_APP_STORE);
        if (store === 'yes') {
            const consent = localStorage.getItem('userConsent');
            if (consent === null) {
                setIsConsentModalOpen(true);
            } else {
                setIsConsentGiven(true); // Consent already given
            }
        } else {
            setIsConsentGiven(true); // No consent required if store === 'no'
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

    return (
        <ThemeProvider theme={theme}>
            <Box sx={styles.appContainer}>
                {/* Modal for consent if needed */}
                {store === 'yes' && isConsentModalOpen && (
                    <Modal open={isConsentModalOpen}>
                        <Box sx={styles.modalContent}>
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

                {/* Main Content */}
                {localStorage.getItem('userConsent')!=null && (
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
        paddingTop: '5vh',
        paddingBottom: '18vh',
        marginTop: '5vh',
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
