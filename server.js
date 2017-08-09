var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.lastPlayderID = 0;
server.master = 0;

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){

    socket.on('newplayer',function(){
        socket.player = {
            id: server.lastPlayderID++,
            x: server.master,
            y: randomInt(100,400)
        };
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);

        socket.on('click',function(data){
            console.log('click to '+data.x+', '+data.y);
            socket.player.x = data.x;
            socket.player.y = data.y;
            io.emit('move',socket.player);
        });

        socket.on('disconnect',function(){
            console.log('disconnect on '+server.master+'=?'+socket.player.id);
            if (socket.player.id === server.master) {
                    server.master = server.lastPlayderID;
                    console.log('missed me not'+server.master+'=?'+server.lastPlayderID);
            }; 
            io.emit('remove',socket.player.id);
            console.log('disconnect on '+server.master+'=?'+server.lastPlayderID);
        });
    });

    socket.on('test',function(){
        console.log('test received');
    });

    socket.on('newBall',function(data){
        io.emit('ballStart',data);
    });

    socket.on('textUpdate',function(data){
        io.emit('newText',data);
    });    
});

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}