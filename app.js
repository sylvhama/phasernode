var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var port = process.env.PORT || 5000;
app.listen(port);

var qrCode = require('qrcode-npm')
var randomstring = require("randomstring");
var url = require('url');
var querystring = require('querystring');

var rooms = [];

function handler (req, res) {
  if(req.url=='/') { 
    fs.readFile(__dirname + '/index.html',
      function (err, data) {
	    if (err) {
		  console.log('----- error 500 index -----');
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }
		console.log('----- index.html loaded -----');
	    res.writeHead(200);
	    res.end(data);
      });
  }else if(req.url.indexOf('/gamepad?id=') != -1) { 
    fs.readFile(__dirname + '/gamepad.html',
      function (err, data) {
	    if (err) {
		  console.log('----- error 500 gamepad -----');
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }		
		console.log('----- gamepad.html loaded -----');
	    res.writeHead(200);
	    res.end(data);
      });
  }else if(req.url.indexOf('.css') != -1) { 
   fs.readFile(__dirname + '/css/style.css', function (err, data) {
	  if (err) {
	    console.log('----- error 500 css -----'); 
		return res.writeHead(500);
	  }
	  console.log('----- css loaded -----');
	  res.writeHead(200, {'Content-Type': 'text/css'});
	  res.write(data);
	  return res.end();
    });
  }else if(req.url.indexOf('.js') != -1) { 
   fs.readFile(__dirname + req.url.substring(req.url.indexOf('/js/'), req.url.length), function (err, data) {
	  if (err) {
	    console.log('----- error 500 js -----'); 
		return res.writeHead(500);
	  }
	  console.log('----- js loaded -----');
	  res.writeHead(200, {'Content-Type': 'text/javascript'});
	  res.write(data);
	  return res.end();
    });
  }else if(req.url.indexOf('.png') != -1 || req.url.indexOf('.jpg') != -1 || req.url.indexOf('.gif') != -1) { 
   fs.readFile(__dirname + req.url.substring(req.url.indexOf('/assets/'), req.url.length), function (err, data) {
	  if (err) {
	    console.log('----- error 500 assets -----'); 
		return res.writeHead(500);
	  }
	  console.log('----- assets loaded -----');
	  res.writeHead(200, {'Content-Type': 'image'});
	  res.write(data);
	  return res.end();
    });
  }else {
	res.writeHead(404);
	console.log('----- error 404 -----');
	return res.end('404 page not found.');
  }
}

io.sockets.on('connection', function (socket) {
  var params = querystring.parse(url.parse(socket.handshake.headers.referer).query);
  if (typeof params.id !== 'undefined') {
    console.log('----- A user is connected, ID: ' + socket.id + ' from gamepad -----');
	var roomName = params.id;
	if (rooms.indexOf(roomName) > -1) {
	  console.log('----- ' + socket.id + ' has joined ' + roomName + ' -----');
	  socket.join(roomName);
	  socket.emit('roomJoined',{room: roomName});
	}else {
	  console.log('----- ' + socket.id + ' error room ' + roomName + ' -----');
	  socket.emit('errorRoom',{});
	}
  }else {
    console.log('----- A user is connected, ID: ' + socket.id + ' from index -----');
  }
  
  socket.on('askQrcode', function () {   
    var roomName = randomstring.generate(8);
    //var roomName = 'test';
	rooms.push(roomName);
    var qr = qrCode.qrcode(4, 'M');
    qr.addData('http://phasernode.herokuapp.com' + '/gamepad?id=' + roomName);
    qr.make();
    qrImg = qr.createImgTag(4);
    socket.emit('qrcode', {qrcode: qrImg });
    socket.join(roomName);
	console.log('----- ' + roomName + ' has been joined by ' + socket.id + ' -----');
	console.log('----- Rooms: ' + rooms.toString() + ' -----');
  });
  
  socket.on('gamepadMove', function (data) { 
	console.log(data);
	var keys = Object.keys(io.sockets.manager.roomClients[socket.id]);
	for(var k = 0; k < keys.length; k++) {
	  var aRoom = keys[k].substring(1,keys[k].length);
	  i = rooms.indexOf(aRoom);
	  if(i>-1) {
		io.sockets.in(aRoom).emit('gamepadMove', data);
		break;
	  }
	}
  });
  
  socket.on('disconnect', function(){
    console.log('----- ' + socket.id + ' has left -----');
    deleteRoom(socket.id);
  });
  
  function deleteRoom(id) {
    var keys = Object.keys(io.sockets.manager.roomClients[id]);
	for(var k = 0; k < keys.length; k++) {
	  var aRoom = keys[k].substring(1,keys[k].length);
	  i = rooms.indexOf(aRoom);
	  if(i>-1) {
	    io.sockets.in(aRoom).emit('closeRoom', {});
		rooms.splice(i,1);
		console.log('----- ' + aRoom + ' has been deleted -----');
		console.log('----- Rooms: ' + rooms.toString() + ' -----');
	  }
	}
  }
});