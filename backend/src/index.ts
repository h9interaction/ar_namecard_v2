import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { corsOptions } from './config/cors';
import { setupSwagger } from './config/swagger';

import userRoutes from './routes/userRoutes';
import avatarRoutes from './routes/avatarRoutes';
import itemRoutes from './routes/itemRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

connectDB();

setupSwagger(app);

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});