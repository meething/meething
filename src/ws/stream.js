const stream = (socket)=>{
 console.log('initializing stream',socket);
 socket.on(function(data,key){
    console.log('debug stream socket',key,data);
    if(key == 'subscribe'){
        //Inform other members in the room of new user's arrival
        if(socket.adapter.rooms[data.room].length > 1){
            socket.emit('newuser', {socketId:data.socketId});
        }
        console.log(socket.rooms);
    }

    else if(key == 'newUserStart'){
        socket.emit('newUserStart', {sender:data.sender});
    }

    else if(key == 'sdp'){
        socket.emit('sdp', {description: data.description, sender:data.sender});
    }

    else if(key == 'icecandidates'){
        socket.emit('icecandidates', {candidate:data.candidate, sender:data.sender});
    }

    else if(key == 'chat'){
        socket.emit('chat', {sender: data.sender, msg: data.msg});
    }

 });
}

module.exports = stream;
