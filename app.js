var osc     = require('node-osc');
var express = require('express');
var app     = express();
var PORT    = 3000;

var server  = app.listen(PORT);
var io      = require('socket.io')(server);

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
