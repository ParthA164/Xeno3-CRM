import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Chip
} from '@mui/material';

interface MessageVariant {
  text: string;
  tone: string;
  score: number;
}

interface MessageVariantsProps {
  variants: MessageVariant[];
  onSelectVariant: (text: string) => void;
}

const MessageVariants: React.FC<MessageVariantsProps> = ({ variants, onSelectVariant }) => {
  // Get appropriate color for tone
  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'professional':
      case 'formal':
        return '#1976d2'; // Blue
      case 'friendly':
      case 'casual':
        return '#2e7d32'; // Green
      case 'urgent':
      case 'compelling':
        return '#d32f2f'; // Red
      default:
        return '#9c27b0'; // Purple for any other tone
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        AI Suggested Message Variants:
      </Typography>
      
      {variants.map((variant, index) => (
        <Card 
          key={index} 
          variant="outlined"
          sx={{ 
            mb: 1.5, 
            borderLeft: `4px solid ${getToneColor(variant.tone)}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Chip 
                  label={variant.tone.charAt(0).toUpperCase() + variant.tone.slice(1)} 
                  size="small" 
                  sx={{ mr: 1, bgcolor: getToneColor(variant.tone), color: 'white' }}
                />
                <Chip 
                  label={`Score: ${variant.score}`} 
                  size="small" 
                  variant="outlined"
                  color={variant.score > 80 ? "success" : variant.score > 60 ? "primary" : "default"}
                />
              </Box>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => onSelectVariant(variant.text)}
              >
                Use This
              </Button>
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{variant.text}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default MessageVariants;