import express from 'express';
import http from 'http';
import cors from 'cors'
import {Server} from 'socket.io'


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

io.on('connection', (socket) => {
    console.log('socket connection', socket.id)
    socket.emit("me", socket.id);

    socket.on('calluser', ({userToCall, signalData, from, name}) => {
        io.to(userToCall).emit('calluser', {signal: signalData, from, name})
    })
    socket.on('answercall', (data) => {
        io.to(data.to).emit('callaccepted', {signal: data.signal})
    })

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id)
    })
})

app.use(cors())
const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
    res.send('Server is running properly')
})

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})