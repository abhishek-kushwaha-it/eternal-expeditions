const mode = process.argv[2];

if (mode !== 'development' && mode !== 'production') {
  throw new Error('Specify a server mode: development or production.');
}

process.env.NODE_ENV = mode;
require('./server');
