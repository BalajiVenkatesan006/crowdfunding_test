import React, { useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import heic2any from 'heic2any';
import { FaChevronLeft, FaChevronRight, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { Box, Typography, IconButton, Button, Modal, Fade, Zoom, CircularProgress, Backdrop } from '@mui/material';
import { useTheme } from '@mui/material/styles';  // Import theme

const ImageUploader = () => {
    const [currentImage, setCurrentImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);  // Main loading state
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [file, setFile] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [loadedImages, setLoadedImages] = useState({});  // Tracks which images are loaded

    const theme = useTheme();  // Get theme from Material-UI

    useEffect(() => {
        const handlePageRefresh = () => {
            localStorage.removeItem('thumbnails');
            localStorage.removeItem('currentImage');
            for (let i = 0; i < 4; i++) {
                localStorage.removeItem(`image_${i}`);
            }
        };

        window.addEventListener('beforeunload', handlePageRefresh);

        return () => {
            window.removeEventListener('beforeunload', handlePageRefresh);
        };
    }, []);

    const clearLocalStorage = () => {
        localStorage.removeItem('thumbnails');
        localStorage.removeItem('currentImage');
        for (let i = 0; i < 4; i++) {
            localStorage.removeItem(`image_${i}`);
        }
    };

    const validateFile = (file) => {
        return new Promise((resolve) => {
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic'];
            const fileExtension = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();

            if (!allowedExtensions.includes(`.${fileExtension}`)) {
                resolve("Invalid file extension. Only .jpg, .jpeg, .png, and .heic are allowed.");
                return;
            }

            if (file.size < 64 * 1024 || file.size > 35 * 1024 * 1024) {
                resolve("File size must be between 256 KB and 35 MB.");
                return;
            }

            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const { data } = imageData;

                let isRgb = true;
                let isGrayscale = true;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a !== 255) {
                        isRgb = false;
                        break;
                    }

                    if (r !== g || g !== b) {
                        isGrayscale = false;
                    }
                }

                if (!isRgb) {
                    resolve("Image must be in RGB format with no alpha channel.");
                } else if (isGrayscale) {
                    resolve("Grayscale images are not allowed. Please upload a colored image.");
                } else {
                    resolve(null);
                }
            };

            img.onerror = () => {
                resolve("Invalid image file or unsupported format.");
            };
        });
    };

    const validateAndResizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = async () => {
                if (img.width > 0 && img.height > 0) {
                    if (img.width > 1024 || img.height > 1024) {
                        try {
                            const resizedBlob = await resizeImage(img, 1024);
                            const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
                            resolve(resizedFile);
                        } catch (error) {
                            reject("Failed to resize image.");
                        }
                    } else {
                        resolve(file);
                    }
                } else {
                    reject("Invalid image content.");
                }
            };

            img.onerror = () => {
                reject("File is not a valid image.");
            };
        });
    };

    const resizeImage = (img, maxSize) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        });
    };

    const fetchInitialImages = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append("store", localStorage.getItem('userConsent') ? localStorage.getItem('userConsent') : "false");

        try {
            const response = await axios.post('api/gamut/thumbnails_and_first_image/', formData, {
                responseType: 'json',
            });

            const { thumbnails, first_image } = response.data;

            const formattedThumbnails = thumbnails.map(thumbnail => `data:image/png;base64,${thumbnail}`);
            const formattedFirstImage = `data:image/png;base64,${first_image}`;

            setCurrentImage(formattedFirstImage);
            setIsButtonDisabled(false);

            localStorage.setItem('thumbnails', JSON.stringify(formattedThumbnails));
            localStorage.setItem('currentImage', formattedFirstImage);

            const byteString = atob(first_image);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);

            for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([uint8Array], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);

            localStorage.setItem('image_0', imageUrl);

            setLoadedImages(prev => ({ ...prev, 0: true }));  // Fixed unnecessary computed property

            fetchOtherImagesInBackground(file);

        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to fetch images.');
        }
    };

    const fetchOtherImagesInBackground = async (file) => {
        const totalThumbnails = JSON.parse(localStorage.getItem('thumbnails')).length;
        setIsBackgroundLoading(true);
        try {
            const promises = [];
            for (let i = 1; i < totalThumbnails; i++) {
                promises.push(fetchFullImage(i, file, true)); 
            }
            await Promise.all(promises); 
        } finally {
            setIsBackgroundLoading(false);
        }
    };

    const fetchFullImage = async (index, file, isBackground = false) => {
        const cachedImage = localStorage.getItem(`image_${index}`);
        if (cachedImage) {
            if (!isBackground) {
                setCurrentImage(cachedImage);
                setCurrentIndex(index);
                setZoomLevel(1);
            }
            setLoadedImages(prev => ({ ...prev, [index]: true }));
            return;
        }

        // if (!isBackground) setLoading(true);  // Loading only for navigation
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(`api/gamut/image/${index + 1}/`, formData, {
                responseType: 'arraybuffer',
            });

            const blob = new Blob([response.data], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);

            if (!isBackground) {
                setCurrentImage(imageUrl);
                setCurrentIndex(index);
                setZoomLevel(1); 
                setLoading(false);
            }

            localStorage.setItem(`image_${index}`, imageUrl);
            localStorage.setItem('currentImage', imageUrl);

            setLoadedImages(prev => ({ ...prev, [index]: true }));

        } catch (error) {
            console.error('Error fetching full image:', error);
            setError('Failed to fetch full image.');
            if (!isBackground) setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles) => {
        clearLocalStorage(); 
        setError(null);
        setLoading(true); 
        let file = acceptedFiles[0];
        try {
            if (file.type === 'image/heic' || file.name.endsWith('.HEIC')) {
                try {
                    const convertedBlob = await heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                    });
                    file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                        type: 'image/jpeg',
                    });
                } catch (conversionError) {
                    throw new Error("Failed to convert HEIC file. The file may be invalid or not a genuine HEIC image.");
                }
            }
            const validationError = await validateFile(file);
            if (validationError) {
                throw new Error(validationError);
            }
            const resizedFile = await validateAndResizeImage(file);
            setFile(resizedFile);
            setCurrentIndex(0); 
            await fetchInitialImages(resizedFile);
            setError(null);
            setIsButtonDisabled(false);
            setLoading(false); 
        } catch (error) {
            setError(error.message);
            setLoading(false); 
            console.error(error);
        }
    };

    const handleNextImage = async () => {
        const thumbnails = JSON.parse(localStorage.getItem('thumbnails'));
        const newIndex = (currentIndex + 1) % thumbnails.length;
        if (!loadedImages[newIndex]) return; // Disable navigation if not loaded
        // setLoading(true);
        await fetchFullImage(newIndex, file);  // Ensure we wait for the image to load
        setCurrentIndex(newIndex);  // Update the currentIndex only after the image has loaded
        setLoading(false); // Turn off the spinner after image is loaded
    };
    
    const handlePreviousImage = async () => {
        const thumbnails = JSON.parse(localStorage.getItem('thumbnails'));
        const newIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
        if (!loadedImages[newIndex]) return; // Disable navigation if not loaded
        // setLoading(true);
        await fetchFullImage(newIndex, file);  // Ensure we wait for the image to load
        setCurrentIndex(newIndex);  // Update the currentIndex only after the image has loaded
        setLoading(false); // Turn off the spinner after image is loaded
    };

    const handleImageClick = () => {
        setIsFullscreen(true);
    };

    const handleCloseFullscreen = () => {
        setIsFullscreen(false);
    };

    const handleZoomIn = () => {
        setZoomLevel(prevZoom => Math.min(prevZoom + 0.2, 3)); 
    };

    const handleZoomOut = () => {
        setZoomLevel(prevZoom => Math.max(prevZoom - 0.2, 1)); 
    };

    const handleOrderClick = () => {
        clearLocalStorage();
        window.location.href = 'https://www.kickstarter.com/?lang=de';
    };

    const getCaption = () => {
        if (currentIndex + 1 === 1) {
            return 'Jute Background';
        }
        if (currentIndex + 1 === 2) {
            return 'Lamp Background';
        }
        if (currentIndex + 1 === 3) {
            return 'Stone Background';
        }
        if (currentIndex + 1 === 4) {
            return 'Beetle Effect';
        }
        return `Image ${currentIndex + 1}`;
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.dropzoneAndImageContainer}>
                <Dropzone onDrop={onDrop} multiple={false} accept="image/*">
                    {({ getRootProps, getInputProps }) => (
                        <Box {...getRootProps()} sx={styles.dropzone}>
                            <input {...getInputProps()} />
                            <Typography variant="body1" sx={styles.dropzoneText}>
                                Drag & drop your image here, or click to select
                            </Typography>
                        </Box>
                    )}
                </Dropzone>

                {error && <Typography color="error" sx={styles.error}>{error}</Typography>}

                {/* Main loading spinner displayed over the current image */}
                {loading && (
                    <Backdrop open={loading} sx={styles.backdrop}>
                        <CircularProgress color="inherit" />
                    </Backdrop>
                )}

                {localStorage.getItem('thumbnails') && (
                    <Fade in={!loading} timeout={1000}>
                        <Box sx={styles.imageAndThumbnailsContainer}>
                            <Box sx={styles.imageContainer}>
                                <Zoom in={!loading}>
                                    <Box
                                        sx={styles.imageWrapper}
                                        onMouseEnter={() => {
                                            document.getElementById('navLeft').style.visibility = 'visible';
                                            document.getElementById('navRight').style.visibility = 'visible';
                                        }}
                                        onMouseLeave={() => {
                                            document.getElementById('navLeft').style.visibility = 'hidden';
                                            document.getElementById('navRight').style.visibility = 'hidden';
                                        }}
                                    >
                                        <IconButton
                                            id="navLeft"
                                            onClick={handlePreviousImage}
                                            sx={{ ...styles.navigationIcon, left: '10px', visibility: 'hidden' }}
                                            disabled={!loadedImages[(currentIndex - 1 + JSON.parse(localStorage.getItem('thumbnails')).length) % JSON.parse(localStorage.getItem('thumbnails')).length]}
                                        >
                                            <FaChevronLeft />
                                        </IconButton>
                                        <img src={currentImage} alt="Processed" style={styles.image} onClick={handleImageClick} />
                                        <IconButton
                                            id="navRight"
                                            onClick={handleNextImage}
                                            sx={{ ...styles.navigationIcon, right: '10px', visibility: 'hidden' }}
                                            disabled={!loadedImages[(currentIndex + 1) % JSON.parse(localStorage.getItem('thumbnails')).length]}
                                        >
                                            <FaChevronRight />
                                        </IconButton>
                                    </Box>
                                </Zoom>
                            </Box>

                            <Box sx={styles.captionContainer}>
                                <Typography variant="subtitle1" sx={styles.caption}>
                                    {getCaption()}
                                </Typography>
                            </Box>

                            <Box sx={styles.thumbnailContainer}>
                                {JSON.parse(localStorage.getItem('thumbnails')).map((thumbnail, index) => (
                                    <Box key={index} sx={styles.thumbnailWrapper}>
                                        <img
                                            src={thumbnail}
                                            alt={`Thumbnail ${index + 1}`}
                                            style={{
                                                ...styles.thumbnail,
                                                borderColor: currentIndex === index ? theme.palette.primary.main : '#ccc',
                                            }}
                                            onClick={() => loadedImages[index] && fetchFullImage(index, file)}
                                            disabled={!loadedImages[index]}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Box>

            {isBackgroundLoading && (
                <Box sx={styles.backgroundLoadingContainer}>
                    <CircularProgress size={30} color="inherit" />
                    <Typography variant="caption" sx={styles.backgroundLoadingText}>
                        Downloading images...
                    </Typography>
                </Box>
            )}

            {isFullscreen && (
                <Modal open={isFullscreen} onClose={handleCloseFullscreen}>
                    <Box sx={styles.fullscreenContainer}>
                        <Box sx={styles.fullscreenControls}>
                            <IconButton
                                onClick={handleCloseFullscreen}
                                sx={{ color: 'white' }}
                            >
                                <FaTimes />
                            </IconButton>
                            <IconButton
                                onClick={handleZoomIn}
                                sx={{ color: 'white' }}
                            >
                                <FaSearchPlus />
                            </IconButton>
                            <IconButton
                                onClick={handleZoomOut}
                                sx={{ color: 'white' }}
                            >
                                <FaSearchMinus />
                            </IconButton>
                        </Box>
                        <img
                            src={currentImage}
                            alt="Fullscreen"
                            style={{ ...styles.fullscreenImage, transform: `scale(${zoomLevel})` }}
                        />
                    </Box>
                </Modal>
            )}

            <Button
                variant="contained"
                sx={{
                    ...styles.kickstarterButton,
                    opacity: isButtonDisabled ? 0.5 : 1,
                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                }}
                onClick={handleOrderClick}
                disabled={isButtonDisabled}
            >
                Order on Kickstarter
            </Button> 
        </Box>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        padding: '10px 20px',
        overflowY: 'auto',
        boxSizing: 'border-box',
    },
    dropzoneAndImageContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: '20px',
        flexGrow: 1,
        paddingTop: '10px',
    },
    dropzone: {
        width: '100%',
        maxWidth: '600px',
        height: '80px',
        borderWidth: '2px',
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: '#fff',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
    },
    dropzoneText: {
        fontSize: '1.1em',
        color: '#888',
    },
    error: {
        color: 'red',
        marginTop: '10px',
        textAlign: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    imageAndThumbnailsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '800px',
    },
    imageContainer: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        padding: '0px',
        height: '300px',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-in-out',
    },
    navigationIcon: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '2em',
        color: '#373a71',  // Header color
        zIndex: 1,
    },
    captionContainer: {
        width: '100%',
        padding: '10px',
        textAlign: 'center',
    },
    caption: {
        color: '#373a71',  // Header background color
        fontFamily: '"Poppins", sans-serif',  // Apply Poppins font
        fontSize: '16px',
        letterSpacing: 'normal',
        whiteSpace: 'pre-wrap',
        lineHeight: '28.8px',
    },
    thumbnailContainer: {
        display: 'flex',
        flexDirection: { xs: 'row', md: 'row' },
        justifyContent: 'center',
        gap: '10px',
        marginTop: '10px',
        width: '100%',
        maxWidth: '800px',
        overflowX: 'auto',
    },
    thumbnailWrapper: {
        position: 'relative',
    },
    thumbnail: {
        width: '60px',
        height: '60px',
        objectFit: 'contain',
        cursor: 'pointer',
        borderRadius: '5px',
        border: '2px solid #ccc',
    },
    kickstarterButton: {
        width: '100%',
        maxWidth: '600px',
        padding: '15px 30px',
        fontSize: '1.1em',
        color: '#fff',
        backgroundColor: '#808080', // Changed to match Oraclase's theme (gray color)
        borderRadius: '25px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
        marginTop: '20px',
        marginBottom: '20px',
    },
    fullscreenContainer: {
        position: 'fixed',
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)', // Increased opacity
        zIndex: 1300,
        padding: '20px',
    },
    fullscreenImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        transition: 'transform 0.3s ease-in-out',
    },
    fullscreenControls: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        zIndex: 2,
    },
    backdrop: {
        zIndex: 1500,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        alignItems: 'center',
    },
    backgroundLoadingContainer: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    backgroundLoadingText: {
        marginTop: '10px',
        color: '#888',
        fontWeight: 'bold',
    },
};

export default ImageUploader;
