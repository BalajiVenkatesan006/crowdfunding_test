import React, { useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import heic2any from 'heic2any';
import { PulseLoader } from 'react-spinners';
import { FaChevronLeft, FaChevronRight, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { Box, Typography, IconButton, Button, Modal, Fade, Paper } from '@mui/material';

const ImageUploader = () => {
    const [currentImage, setCurrentImage] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [file, setFile] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);

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

        try {
            const response = await axios.post('http://localhost:8000/api/gamut/thumbnails_and_first_image/', formData, {
                responseType: 'json',
            });

            const { thumbnails, first_image } = response.data;

            const formattedThumbnails = thumbnails.map(thumbnail => `data:image/png;base64,${thumbnail}`);
            const formattedFirstImage = `data:image/png;base64,${first_image}`;

            // Set the current image immediately after fetching
            setCurrentImage(formattedFirstImage);
            setIsButtonDisabled(false);

            // Save the thumbnails and first image in localStorage
            localStorage.setItem('thumbnails', JSON.stringify(formattedThumbnails));
            localStorage.setItem('currentImage', formattedFirstImage);

        } catch (error) {
            console.error('Error fetching images:', error);
            setError('Failed to fetch images.');
        }
    };

    const fetchFullImage = async (index, file) => {
        const cachedImage = localStorage.getItem(`image_${index}`);
        if (cachedImage) {
            setCurrentImage(cachedImage);
            setCurrentIndex(index);
            setZoomLevel(1);
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(`http://localhost:8000/api/gamut/image/${index + 1}/`, formData, {
                responseType: 'arraybuffer',
            });

            const blob = new Blob([response.data], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);
            setCurrentImage(imageUrl);
            setCurrentIndex(index);
            setZoomLevel(1); // Reset zoom level on image change
            setLoading(false);

            localStorage.setItem(`image_${index}`, imageUrl);
            localStorage.setItem('currentImage', imageUrl);
        } catch (error) {
            console.error('Error fetching full image:', error);
            setError('Failed to fetch full image.');
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles) => {
        clearLocalStorage(); // Clear the local storage before processing a new image
        setError(null);
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
            await fetchInitialImages(resizedFile);
            setError(null);
            setIsButtonDisabled(false);
        } catch (error) {
            setError(error.message);
            console.error(error);
        }
    };

    const handleNextImage = () => {
        const newIndex = (currentIndex + 1) % JSON.parse(localStorage.getItem('thumbnails')).length;
        fetchFullImage(newIndex, file);
    };

    const handlePreviousImage = () => {
        const newIndex = (currentIndex - 1 + JSON.parse(localStorage.getItem('thumbnails')).length) % JSON.parse(localStorage.getItem('thumbnails')).length;
        fetchFullImage(newIndex, file);
    };

    const handleImageClick = () => {
        setIsFullscreen(true);
    };

    const handleCloseFullscreen = () => {
        setIsFullscreen(false);
    };

    const handleZoomIn = () => {
        setZoomLevel(prevZoom => Math.min(prevZoom + 0.2, 3)); // Max zoom level 3x
    };

    const handleZoomOut = () => {
        setZoomLevel(prevZoom => Math.max(prevZoom - 0.2, 1)); // Min zoom level 1x
    };

    const handleOrderClick = () => {
        clearLocalStorage();
        window.location.href = 'https://www.kickstarter.com/?lang=de';
    };

    const getCaption = () => {
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

                {localStorage.getItem('thumbnails') && (
                    <Fade in={!loading} timeout={1000}>
                        <Box sx={styles.imageAndThumbnailsContainer}>
                            <Box sx={styles.imageContainer}>
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
                                    {loading && (
                                        <Box sx={styles.loadingOverlay}>
                                            <PulseLoader color="#FF8C00" size={15} margin={2} />
                                        </Box>
                                    )}
                                    <IconButton
                                        id="navLeft"
                                        onClick={handlePreviousImage}
                                        sx={{ ...styles.navigationIcon, left: '10px', visibility: 'hidden' }}
                                    >
                                        <FaChevronLeft />
                                    </IconButton>
                                    <img src={currentImage} alt="Processed" style={styles.image} onClick={handleImageClick} />
                                    <IconButton
                                        id="navRight"
                                        onClick={handleNextImage}
                                        sx={{ ...styles.navigationIcon, right: '10px', visibility: 'hidden' }}
                                    >
                                        <FaChevronRight />
                                    </IconButton>
                                    <Paper elevation={3} sx={styles.captionContainer}>
                                        <Typography variant="subtitle1" sx={styles.caption}>
                                            {getCaption()}
                                        </Typography>
                                    </Paper>
                                </Box>
                                <Box sx={styles.thumbnailContainer}>
                                    {JSON.parse(localStorage.getItem('thumbnails')).map((thumbnail, index) => (
                                        <img
                                            key={index}
                                            src={thumbnail}
                                            alt={`Thumbnail ${index + 1}`}
                                            style={{
                                                ...styles.thumbnail,
                                                borderColor: currentIndex === index ? '#007bff' : '#ccc',
                                            }}
                                            onClick={() => fetchFullImage(index, file)}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Box>

            {error && <Typography color="error" sx={styles.error}>{error}</Typography>}

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
        height: 'calc(100vh - 100px)', // Adjust the height to fit between the header and footer
        padding: '20px',
        overflowY: 'auto', // Enable scrolling on mobile screens
        boxSizing: 'border-box',
    },
    dropzoneAndImageContainer: {
        display: 'flex',
        flexDirection: 'column', // Stack all elements vertically on all screen sizes
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: '20px',
        flexGrow: 1, // Allow the container to grow and take available space
    },
    dropzone: {
        width: '100%',
        maxWidth: '600px',
        height: '100px', // Reduce height to save space
        borderWidth: '2px',
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '10px', // Reduce padding to save space
        backgroundColor: '#fff',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
    },
    dropzoneText: {
        fontSize: '1.1em',
        color: '#888',
    },
    imageAndThumbnailsContainer: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // Stack the image and thumbnails vertically on mobile, horizontally on larger screens
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
    },
    imageContainer: {
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        padding: '10px',
        height: '300px', // Adjusted height to ensure visibility on smaller screens
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    image: {
        width: 'auto',
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
        color: '#FF8C00',
        zIndex: 1,
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
    thumbnailContainer: {
        display: 'flex',
        flexDirection: 'column', // Always display thumbnails vertically
        justifyContent: 'center',
        gap: '10px',
        maxHeight: '300px',
        overflowY: 'auto', // Enable vertical scrolling if needed
        marginTop: { xs: '20px', md: '0' }, // Add margin-top on mobile screens
        marginLeft: { xs: '0', md: '20px' }, // Add margin-left on larger screens
    },
    thumbnail: {
        width: '60px',
        height: '60px',
        objectFit: 'contain',
        cursor: 'pointer',
        borderRadius: '5px',
        border: '2px solid #ccc',
    },
    error: {
        color: 'red',
        marginTop: '20px',
    },
    loaderContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '30px',
    },
    loadingText: {
        marginTop: '10px',
        fontSize: '1em',
        color: '#666',
    },
    kickstarterButton: {
        width: '100%',
        maxWidth: '600px',
        padding: '15px 30px',
        fontSize: '1.1em',
        color: '#fff',
        backgroundColor: '#FF8C00',
        borderRadius: '25px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
        marginTop: '20px',
    },
    fullscreenContainer: {
        position: 'fixed',
        top: '10vh',
        bottom: '10vh',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    captionContainer: {
        position: 'absolute',
        bottom: '-10px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        textAlign: 'center',
    },
    caption: {
        color: '#007bff',
        fontWeight: 'bold',
    },
};

export default ImageUploader;
