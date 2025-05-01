// server/scripts/testRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Create a test app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const congeRoutes = require('../routes/conges');

// Use routes
app.use('/api/conges', congeRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = 5001;
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      console.log('Routes:');
      
      // Print all routes
      function print(path, layer) {
        if (layer.route) {
          layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
        } else if (layer.name === 'router' && layer.handle.stack) {
          layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
        } else if (layer.method) {
          console.log('%s /%s',
            layer.method.toUpperCase(),
            path.concat(split(layer.regexp)).filter(Boolean).join('/'));
        }
      }
      
      function split(thing) {
        if (typeof thing === 'string') {
          return thing.split('/');
        } else if (thing.fast_slash) {
          return [''];
        } else {
          var match = thing.toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
          return match
            ? match[1].replace(/\\(.)/g, '$1').split('/')
            : ['<complex:', thing.toString(), '>'];
        }
      }
      
      app._router.stack.forEach(print.bind(null, []));
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
