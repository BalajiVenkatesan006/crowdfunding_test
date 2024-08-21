import React, { useState } from 'react';
import Dropzone from 'react-dropzone';
import heic2any from 'heic2any';

const ImageUploader = () => {
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);

    const validateImage = (file) => {
        setError(null);

        // File size validation
        if (file.size < 256 * 1024 || file.size > 10 * 1024 * 1024) {
            return "File size must be between 256 KB and 10 MB.";
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                // Check image dimensions
                if (img.width < 256 || img.width > 4048 || img.height < 256 || img.height > 4048) {
                    resolve("Image dimensions must be between 256x256 and 4048x4048 pixels.");
                }

                // Check for RGB format using Canvas
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

                    // Check if the alpha channel is not 255 (fully opaque)
                    if (a !== 255) {
                        isRgb = false;
                        break;
                    }

                    // Check if the R, G, B channels are not the same (i.e., it's not grayscale)
                    if (r !== g || g !== b || b !== r) {
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

    const onDrop = async (acceptedFiles) => {
        let file = acceptedFiles[0];

        try {
            if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
                // Convert HEIC to JPEG using heic2any
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                });
                file = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), {
                    type: 'image/jpeg',
                });
            } else if (file.type === 'image/avif' || file.name.endsWith('.avif')) {
                // Convert AVIF to JPEG using Canvas
                const convertedBlob = await convertAvifToJpeg(file);
                file = new File([convertedBlob], file.name.replace(/\.avif$/i, '.jpg'), {
                    type: 'image/jpeg',
                });
            }

            const validationError = await validateImage(file);

            if (validationError) {
                setError(validationError);
                setImage(null);
            } else {
                setImage(URL.createObjectURL(file));
                setError(null);
            }
        } catch (error) {
            setError('An error occurred while processing the image.');
            console.error(error);
        }
    };

    const convertAvifToJpeg = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert the canvas content to a JPEG Blob
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg');
            };

            img.onerror = () => {
                reject(new Error('Failed to load the image.'));
            };
        });
    };

    return (
        <div style={styles.container}>
            <Dropzone onDrop={onDrop} multiple={false} accept="image/*">
                {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()} style={styles.dropzone}>
                        <input {...getInputProps()} />
                        <p>Drag & drop an image here, or click to select one</p>
                    </div>
                )}
            </Dropzone>
            {error && <p style={styles.error}>{error}</p>}
            {image && <img src={image} alt="Uploaded Preview" style={styles.image} />}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    dropzone: {
        width: '100%',
        maxWidth: '500px',
        height: '200px',
        borderWidth: '2px',
        borderColor: '#666',
        borderStyle: 'dashed',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        marginBottom: '20px',
        backgroundColor: '#f7f7f7',
        transition: 'all 0.3s ease-in-out',
    },
    error: {
        color: 'red',
        fontWeight: 'bold',
        marginBottom: '20px',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '400px',
        borderRadius: '10px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
    },
    '@media (max-width: 768px)': {
        dropzone: {
            height: '150px',
        },
        image: {
            maxHeight: '300px',
        },
    },
};

export default ImageUploader;
