var http = require('http');

http.createServer(function (req, res) {
  console.log('got one!');
  console.dir(req);
  console.log(req.params)
  res.write('Hello World!'); //write a response to the client
  res.end(); //end the response
}).listen(9876);
