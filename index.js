// server/index.js
const express = require('express');
const app = express();
const cors = require('cors');

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const port = process.env.PORT || 4000;


const leaveRoom = require('./utils/leave-room'); // 


app.use(cors()); // Add cors middleware

// Add this
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
});


app.get('/', (req, res) => {
    res.send('THE SERVER IS RUNNING ;-)');
});


const CHAT_BOT = 'ChatBot'; // Add this
let chatRoom = ''; // E.g. javascript, node,...
let allUsers = []; // All users in current chat room

io.on('connection', (socket) => {
    console.log(`User connected ${socket.id}`);

    socket.on('join_room', ( { username, room } ) => { // Add a user to a room
        
        socket.join(room); // Join the user to a socket room

        let __createdtime__ = Date.now(); // Current timestamp

        socket.to(room).emit('receive_message', {  // Send message to all users currently in the room, apart from the user that just joined
            message: `${username} has joined the chat room`,
            username: CHAT_BOT,
            __createdtime__,
        });
        





        socket.emit('receive_message', { // Send welcome msg to user that just joined chat only
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });





        socket.on('send_message', (data) => {
            const { message, username, room, __createdtime__ } = data;
            io.in(room).emit('receive_message', data); // Send to all users in room, including sender

            // harperSaveMessage(message, username, room, __createdtime__) // Save message in db
            // .then((response) => console.log(response))
            // .catch((err) => console.log(err));

        });


        
        // harperGetMessages(room)  // Get last 100 messages sent in the chat room
        // .then((last100Messages) => {
            // console.log('latest messages', last100Messages);
            // socket.emit('last_100_messages', last100Messages);
        // })
        // .catch((err) =>{
        //     console.log(err)
        // });

        chatRoom = room;  // Save the new user to the room
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);
        
        






        socket.on('leave_room', (data) => {
            const { username, room } = data;
            socket.leave(room);
            const __createdtime__ = Date.now();
            allUsers = leaveRoom(socket.id, allUsers);             // Remove user from memory
            socket.to(room).emit('chatroom_users', allUsers);
            socket.to(room).emit('receive_message', {
              username: CHAT_BOT,
              message: `${username} has left the chat`,
              __createdtime__,
            });
            console.log(`${username} has left the chat`);
        });





        socket.on('disconnect', () => {
            console.log('User disconnected from the chat');
            const user = allUsers.find((user) => user.id == socket.id);
            if (user?.username) {
              allUsers = leaveRoom(socket.id, allUsers);
              socket.to(chatRoom).emit('chatroom_users', allUsers);
              socket.to(chatRoom).emit('receive_message', {
                message: `${user.username} has disconnected from the chat.`,
              });
            }
        });


        

    });

});



server.listen(port, () =>{
    console.log( "'Server is running on port: ", port );
});