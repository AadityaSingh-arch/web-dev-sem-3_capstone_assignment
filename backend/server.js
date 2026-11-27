require('dotenv').config();
const http = require('http');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { initSocket } = require('./src/utils/socket');
const notifier = require('./src/services/notifier');

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')} (copy .env.example to .env)`);
  process.exit(1);
}

(async () => {
  await connectDB();
  const server = http.createServer(app);
  const io = initSocket(server);
  notifier.init(io);
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`CampusVoice API running on port ${port}`));
})();
