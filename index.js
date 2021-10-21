require('dotenv').config()
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
var cors = require('cors');
const bodyParser = require('body-parser');
var session = require('express-session')
const formidable = require('formidable');
const { Client } = require('pg')
const cloudinary = require('cloudinary').v2;

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
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true
});

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

app.post('/upload', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        cloudinary.uploader.upload(files.file.path, function(error, result) {
            console.log(result.url, error);
            let text;
            const currentTime = new Date().toISOString();
            const client = new Client({
                ssl: { rejectUnauthorized: false },
                user: process.env.PGUSER,
                host: process.env.PGHOST,
                database: process.env.PGDATABASE,
                password: process.env.PGPASSWORD,
                port: process.env.PGPORT
            });
            client.connect();

            if(fields.spot == 'one') {
                text = 'UPDATE images SET image_one = $1, updated_at = $2 WHERE id = 1'
            }
            else {
                text = 'UPDATE images SET image_two = $1, updated_at = $2 WHERE id = 1'
            }
            const values = [result.url, currentTime]
            client.query(text, values, (err, res) => {
                if (err) {
                    console.log(err.stack)
                } else {
                    console.log(res.rows)
                }
            })
        });
    })
})

app.get('/images', function (req, res) {
    const client = new Client({
        ssl: { rejectUnauthorized: false },
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT
    });
    client.connect();

    const query = 'SELECT * FROM images'
    client.query(query, (err, result) => {
        if (err) {
            console.log(err.stack)
        } else {
            res.json({
                one: result.rows[0]["image_one"],
                two: result.rows[0]["image_two"],
            });
        }
    })
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
