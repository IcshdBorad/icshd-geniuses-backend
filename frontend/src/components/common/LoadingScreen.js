/**
 * Loading Screen Component for ICSHD GENIUSES
 * Displays loading animation while app initializes
 */

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { School } from '@mui/icons-material';

const LoadingScreen = ({ message = 'جاري التحميل...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        zIndex: 9999,
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        {/* Logo Animation */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <School sx={{ fontSize: 80 }} />
        </motion.div>

        {/* App Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            ICSHD GENIUSES
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            منصة العباقرة للحساب الذهني
          </Typography>
        </motion.div>

        {/* Loading Indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </motion.div>

        {/* Loading Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        >
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            {message}
          </Typography>
        </motion.div>
      </motion.div>

      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
            animate={{
              x: [0, window.innerWidth],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              scale: [0.5, 1.5, 0.5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: index * 0.5,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default LoadingScreen;
