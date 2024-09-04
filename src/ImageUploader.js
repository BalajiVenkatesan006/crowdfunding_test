import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import heic2any from 'heic2any';
import JSZip from 'jszip';
import axios from 'axios';
import { PulseLoader } from 'react-spinners';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Box, Typography, IconButton, Button, Fade } from '@mui/material';

const ImageUploader = () => {
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const validateFile = (file) => {
        return new Promise((resolve) => {
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic'];
            const fileExtension = file.name.slice((file.name.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();

            if (!allowedExtensions.includes(`.${fileExtension}`)) {
                resolve("Invalid file extension. Only .jpg, .jpeg, .png, and .heic are allowed.");
                return;
            }

            if (file.size < 256 * 1024 || file.size > 35 * 1024 * 1024) {
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

    const uploadImage = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('http://localhost:8000/api/gamut/image/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'arraybuffer', // Expecting a binary response (zip file)
            });

            // Extract images from the zip file
            const zip = new JSZip();
            const unzipped = await zip.loadAsync(response.data);
            const imageFiles = Object.values(unzipped.files).map((file) => file.async('blob'));
            const imageUrls = await Promise.all(imageFiles).then((blobs) =>
                blobs.map((blob) => URL.createObjectURL(blob))
            );

            setImages(imageUrls);
            setIsButtonDisabled(false);
            setLoading(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            setError('Failed to upload and process image.');
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles) => {
        setError(null); // Clear any existing errors
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

            await uploadImage(resizedFile);
            setError(null);
            setIsButtonDisabled(false);
        } catch (error) {
            setError(error.message);
            console.error(error);
        }
    };

    const handleKickstarterRedirect = () => {
        window.location.href = 'https://www.kickstarter.com/?lang=de';
    };

    const handleNextImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePreviousImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
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

                {images.length > 0 && !loading && (
                    <Fade in={!loading} timeout={1000}>
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
                                <IconButton
                                    id="navLeft"
                                    onClick={handlePreviousImage}
                                    sx={{ ...styles.navigationIcon, left: '10px', visibility: 'hidden' }}
                                >
                                    <FaChevronLeft />
                                </IconButton>
                                <img src={images[currentIndex]} alt="Processed" style={styles.image} />
                                <IconButton
                                    id="navRight"
                                    onClick={handleNextImage}
                                    sx={{ ...styles.navigationIcon, right: '10px', visibility: 'hidden' }}
                                >
                                    <FaChevronRight />
                                </IconButton>
                                <Typography variant="caption" sx={styles.caption}>
                                    {getCaption()}
                                </Typography>
                            </Box>
                            <Box sx={styles.thumbnailContainer}>
                                {images.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`Thumbnail ${index + 1}`}
                                        style={{
                                            ...styles.thumbnail,
                                            borderColor: currentIndex === index ? '#007bff' : '#ccc',
                                        }}
                                        onClick={() => setCurrentIndex(index)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Box>

            {error && <Typography color="error" sx={styles.error}>{error}</Typography>}
            {loading && (
                <Box sx={styles.loaderContainer}>
                    <PulseLoader color="#FF8C00" size={15} margin={2} />
                    <Typography variant="body2" sx={styles.loadingText}>
                        Processing your image...
                    </Typography>
                </Box>
            )}

            <Button
                variant="contained"
                sx={{
                    ...styles.kickstarterButton,
                    opacity: isButtonDisabled ? 0.5 : 1,
                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                }}
                onClick={handleKickstarterRedirect}
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
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '20px',
        boxSizing: 'border-box',
        gap: '20px',
    },
    dropzoneAndImageContainer: {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '900px',
        gap: '20px',
    },
    dropzone: {
        flex: 1,
        height: '150px',
        borderWidth: '2px',
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: '#fff',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
    },
    dropzoneText: {
        fontSize: '1.1em',
        color: '#888',
    },
    imageContainer: {
        flex: 2,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        padding: '20px',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
            transform: 'scale(1.05)',
        },
    },
    image: {
        width: 'auto',
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        objectFit: 'contain',
    },
    navigationIcon: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '2em',
        color: '#FF8C00',
        zIndex: 1,
    },
    thumbnailContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: '10px',
    },
    thumbnail: {
        width: '60px',
        height: '60px',
        objectFit: 'contain',
        margin: '5px 0',
        cursor: 'pointer',
        borderRadius: '5px',
        border: '2px solid #ccc',
    },
    caption: {
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '1em',
        color: '#007bff',
        fontWeight: 'bold',
        backgroundColor: '#fff',
        borderRadius: '5px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        padding: '10px',
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
        padding: '15px 30px',
        fontSize: '1.1em',
        color: '#fff',
        backgroundColor: '#FF8C00',
        borderRadius: '25px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
    },

    '@media (max-width: 768px)': {
        dropzoneAndImageContainer: {
            flexDirection: 'column',
        },
        imageContainer: {
            width: '100%',
        },
        image: {
            maxHeight: '300px',
        },
        kickstarterButton: {
            padding: '10px 20px',
            fontSize: '0.9em',
        },
    },
    '@media (max-width: 480px)': {
        dropzoneAndImageContainer: {
            flexDirection: 'column',
        },
        imageContainer: {
            width: '100%',
        },
        image: {
            maxHeight: '300px',
        },
        kickstarterButton: {
            padding: '8px 16px',
            fontSize: '0.8em',
        },
    },
};

export default ImageUploader;
