import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const CustomerDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Customer Details
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Individual customer profile with order history, preferences, and engagement data.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerDetail;
