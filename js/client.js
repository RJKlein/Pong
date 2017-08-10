var Client = {};
Client.socket = io.connect();

Client.sendTest = function(){
    console.log("test sent");
    Client.socket.emit('test');
};

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.sendClick = function(x,y){
  Client.socket.emit('click',{x:x,y:y});
};

Client.socket.on('newplayer',function(data){
    playState.addNewPlayer(data.id,data.x,data.y,data.color);
});

Client.sendNewBall = function(x,y,angle,velocity, hitType){
  Client.socket.emit('newBall',{x:x, y:y, angle:angle, velocity:velocity, hitType:hitType});
};

Client.textUpdate = function(instructions, winnerLeft, winnerRight, scoreLeft, scoreRight){
  Client.socket.emit('textUpdate',{instructions:instructions, winnerLeft:winnerLeft, winnerRight:winnerRight, scoreLeft:scoreLeft, scoreRight:scoreRight});
};

Client.socket.on('allplayers',function(data){
    for(var i = 0; i < data.length; i++){
        playState.addNewPlayer(data[i].id,data[i].x,data[i].y,data[i].color);
    }

    Client.socket.on('move',function(data){
        playState.movePlayer(data.id,data.x,data.y);
    });
    
    Client.socket.on('ballEvent',function(data){
        playState.ballEvent(data.x,data.y,data.angle,data.velocity,data.hitType);
    });

    Client.socket.on('newText',function(data){
        playState.newText(data.instructions,data.winnerLeft,data.winnerRight,data.scoreLeft,data.scoreRight);
    });   
    
    Client.socket.on('remove',function(id){
        playState.removePlayer(id);
    });
});


