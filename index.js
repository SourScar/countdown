const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var cors = require('cors');
const bodyParser = require('body-parser');
var session = require('express-session')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors());
app.use(session({
    secret: 'shhh',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1*60*60*1000
    }
}))
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'front')));

io.on('connection', socket => {
    socket.on('clicked', () => {
        io.emit('buttonUpdate', 'clickCount');
    });
    socket.on('paused', () => {
        io.emit('buttonUpdate', 'pauseCount');
    });
    socket.on('stop', () => {
        io.emit('buttonStop', 'stopCount');
    });
    socket.on('timer', message => {
        io.emit('timerTime', message);
    });
});
// API request
app.post('/', function (req, res) {
    if(req.body.password === 'sourscarxmusab'){
        req.session.login = 'success'
        res.send('Correct Password')
    }else{
        res.send('Wrong Password')
    }
})

app.get('/admin', function (req, res) {
    if(!req.session.login){
        return res.status(401).send();
    }
    res.send('Login');
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
