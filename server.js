const express = require('express');
require('dotenv').config();
const path = require('path');


const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/file');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/auth', authRoutes);
app.use('/api/file', fileRoutes);

app.get('/', (req, res) => res.send('🌐 File Server API is running'));

const port = 5000;
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
