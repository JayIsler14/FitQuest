const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/social', require('./routes/social'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
