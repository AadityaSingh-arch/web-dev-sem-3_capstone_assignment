const express = require('express');
const cors = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();
app.use(cors);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'CampusVoice API is up' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/grievances', require('./routes/grievanceRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use((req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404)));
app.use(errorHandler);

module.exports = app;
