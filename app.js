var osc     = require('node-osc');
var express = require('express');
var app     = express();
var PORT    = 3000;

// node server on port 3000
var server  = app.listen(PORT);
var io      = require('socket.io')(server);

// -----------------------------------------------------
// express app setup
// -----------------------------------------------------
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// -----------------------------------------------------
// osc server setup
// -----------------------------------------------------
// var oscServer = new osc.Server(8000, '192.168.1.6');
//
// oscServer.on('message', function(msg, rinfo) {
//   console.log('osc got msg: ', msg);
// });
