// basic Express custom error handler middleware to log the 
// error to the console and return http 500 to the client
function logErrors(err, req, res, next) {
  console.error(err.stack);
  return res.status(500).json({ message: 'Internal Server Error' });
}

module.exports = logErrors;