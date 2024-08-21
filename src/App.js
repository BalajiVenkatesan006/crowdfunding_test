import React from 'react';
import ImageUploader from './ImageUploader';

function App() {
    return (
        <div style={styles.app}>
            <h1 style={styles.title}>Image Uploader</h1>
            <ImageUploader />
        </div>
    );
}

const styles = {
    app: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
    },
    title: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        marginBottom: '20px',
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

export default App;
