var express = require('express');
var app     = express();
var PORT    = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// node server on port 3000
app.listen(PORT, () => {
  console.log('Listening on PORT:' + PORT);
});