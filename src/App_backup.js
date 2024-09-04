import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import oraclaseLogo from './oraclase_logo_black_bg.png';
import { FaInstagram, FaLinkedin, FaYoutube, FaTiktok } from 'react-icons/fa';
import { Container, Box } from '@mui/material';

const App = () => {
    const [isConsentGiven, setIsConsentGiven] = useState(false);

    const handleConsent = () => {
        setIsConsentGiven(true);
    };

    return (
        <div style={styles.appContainer}>
            {!isConsentGiven && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h2>Consent Required</h2>
                        <p>
                            By using this service, you agree that we may store your uploaded image on our server.
                            Please read our <a href="/privacy-policy">Privacy Policy</a> for more details.
                        </p>
                        <button onClick={handleConsent} style={styles.consentButton}>
                            I Agree
                        </button>
                    </div>
                </div>
            )}
            {isConsentGiven && (
                <>
                    <Box sx={styles.header}>
                        <img src={oraclaseLogo} alt="Oraclase Logo" style={styles.logo} />
                        <div style={styles.socialIcons}>
                            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                                <FaInstagram size={24} />
                            </a>
                            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                                <FaLinkedin size={24} />
                            </a>
                            <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
                                <FaYoutube size={24} />
                            </a>
                            <a href="https://www.tiktok.com" target="_blank" rel="noreferrer">
                                <FaTiktok size={24} />
                            </a>
                        </div>
                    </Box>
                    <Container sx={styles.mainContent} maxWidth="lg">
                        <ImageUploader />
                    </Container>
                    <Box sx={styles.footer}>
                        <p>Oraclase | Saarland Informatics Campus | Campus E1 7 (MMCI) | 66123 Saarbrücken, Germany</p>
                        <p>+49 (0) 681 302 707 61 | info@oraclase.com</p>
                    </Box>
                </>
            )}
        </div>
    );
};

const styles = {
    appContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    header: {
        backgroundColor: '#64a3ff',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '5vh',
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
        paddingTop: '10vh',
        backgroundColor: '#e6f2ff', // Light blue background
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        padding: '20px',
    },
    footer: {
        backgroundColor: '#343a40',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        height: '10vh',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%',
    },
    consentButton: {
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '1.1em',
        color: '#fff',
        border: 'none',
        borderRadius: '25px',
        backgroundColor: '#007bff',
        transition: 'background-color 0.3s ease-in-out',
        cursor: 'pointer',
    },
};

export default App;
