// Vercel serverless entry — wraps the Express app
const app = require('./backend/src/app');

// Explicit handler function for Vercel service compatibility
function handler(req, res) {
  return app(req, res);
}

module.exports = handler;
module.exports.default = handler;
