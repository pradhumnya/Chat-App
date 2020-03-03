const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)  // refactoring the express server code. isn't changing the functionality
const io = socketio(server)  //configuring socketio to work with a particular server. // this takes in raw http servers. thats why the above line of code

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))  

// let count = 0

//socket is an object and it contains information about the connection and can be used to communicate with the clients. The funstion runs as many times as the number of clients connected to the server
io.on('connection', (socket) => { //first parameter is event name and 2nd is function when event occurs. This is when client connects to the server. Connection gets fired whenever socket.io gets a new connection.
    console.log('New websocket connected')
    //We send and receive events. .emit sends the events. Here we are sending it from the server. The first parameter of it is the event name
    // socket.emit('countUpdated', count)
    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count)  //emits the event only to the specific connection
    //     io.emit('countUpdated', count) //emits the event to all connections
    // })
    // socket.emit('message', generateMessage('Welcome'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined'))  //Sends the message to everyone except this socket/user/connection

    socket.on('join', ({ username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)  //allows us to join a given chat room given the name of the room. Events can then only be emittedd to this particular room
        //io.to.emit => Emits an event to everybody in a specific room
        //socket.broadcast.to.emit => Emits the event to everyone in a specific room except the specific client
        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))  
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room) 
        })

        callback()  //Without any parameter telling about success
    })

    socket.on('sendMessage', (msg, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        callback()
    })
    socket.on('disconnect', () => {     //when a connection gets disconnected
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))  
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room) 
            })  
        }
        
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback('Location Shared')
    })
})

server.listen(port, () => {
    console.log(`Server is up at ${port}`)
}) 