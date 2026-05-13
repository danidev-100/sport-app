// Vercel serverless entry — wraps the Express app
const app = require('../backend/src/app');

// Support both CJS and Vercel service initialization
module.exports = app;
module.exports.default = app;
