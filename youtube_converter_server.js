// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const fs = require('fs');
const ytdl = require('ytdl-core');
const sanitize = require("sanitize-filename");
const hbs = require('hbs');
const cookieSession = require('cookie-session');
const simpleoauth2 = require('simple-oauth2');
const request = require('request');
const mysql = require('mysql');
const con = mysql.createConnection({
    host: "mysql1.csl.tjhsst.edu",
    user: "site_2018wsun",
    password: "xzWxhBdKkLU9R2wkKA9PJsDs",
    database: "site_2018wsun"
});
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database!");
});

var login_information = JSON.parse(fs.readFileSync(path.join(__dirname,'/login_information_private.json')).toString());

server.listen(port, function() {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, '/../public/')));

var numUsers = 0;

// Enter URL
io.on('connection', function(socket) {
    console.log('entered io connection');

    //user has logged in
    socket.on('new_login', function(login_info) {
        console.log('entered new_login');
        var email = login_info.email;
        var password = login_info.password;
        //pull info from database and validate
        var validation_sql = "SELECT COUNT(*) AS RecordCount FROM r_sc_user_info WHERE email='" + email + "' AND password='" + password + "';";
        con.query(validation_sql, function(err, result) {
            console.log('entered con.query(validation_sql)');
            if (err) throw err;

            console.log("Good Login:\t" + String(result[0].RecordCount > 0));

            socket.emit('login_status', {
                'login_status': result[0].RecordCount > 0,
                'email': email
            });

        });

    });

    //user has registered
    socket.on('new_user', function(login_info) {
        console.log('entered new_user');
        var email = login_info.email;
        var password = login_info.password;
        var firstName = login_info.firstName;
        var middleName = login_info.middleName;
        var lastName = login_info.lastName;

        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;
        //insert info to database
        var registration_sql = "INSERT INTO r_sc_user_info (email, password, level, FirstName, MiddleName, LastName, CreationDate) VALUES ('" + email + "', '" + password + "', 2, '" + firstName + "', '" + middleName + "', '" + lastName + "', '" + dateTime + "')";
        console.log(registration_sql);
        con.query(registration_sql, function(err, result) {
            console.log('entered con.query(registration_sql)');
            if (err) {
                socket.emit('registration_status', {
                    'registration_status': false
                });
                return;
                //throw err;
            }

            socket.emit('registration_status', {
                'registration_status': true,
                'email': email
            });
        });
    });

    //user wants to update profile
    socket.on('update_profile', function(user_info) {
        console.log('entered update_profile');
        var profile_email = user_info.profile_email;
        var currentPassword = user_info.currentPassword;
        var changePassword = user_info.changePassword;

        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var dateTime = date + ' ' + time;
        //insert info to database
        var profile_sql = "UPDATE r_sc_user_info SET password='" + changePassword + "',LastUpdateDate='" + dateTime + "' WHERE email='" + profile_email + "'AND password='" + currentPassword + "'";
        console.log(profile_sql);
        var validation_sql = "SELECT COUNT(*) AS RecordCount FROM r_sc_user_info WHERE email='" + profile_email + "' AND password='" + currentPassword + "';";
        con.query(validation_sql, function(err, result) {
            console.log('entered con.query(validation_sql) under profile');
            if (err) throw err;

            if (result[0].RecordCount > 0) {
                con.query(profile_sql, function(err, result) {
                    console.log('entered con.query(profile_sql)');
                    if (err) {
                        socket.emit('profile_status', {
                            'profile_status': false
                        });
                        return;
                        //throw err;
                    }

                    socket.emit('profile_status', {
                        'profile_status': true,
                        'email': profile_email
                    });
                });
            }
            else{
                socket.emit('profile_status', {
                    'profile_status': false
                });
            }
        });
    });

    //user is authorized to convert
    socket.on('new_url', function(data) {
        console.log('entered socket new_url');

        var client_url = data.url;
        var file_type = data.file_type;
        console.log('client_url: ' + client_url);
        console.log('file_type: ' + file_type);

        if (ytdl.validateURL(client_url)) {
            console.log('Video URL is valid!');
            video_id = String(ytdl.getURLVideoID(client_url));
            console.log('Video ID: ' + video_id);
            ytdl.getInfo(client_url, function(err, info) {
                console.log('entered ytdl getInfo');
                var video_title = info.title;
                var clean_title = sanitize(video_title);
                console.log('Video Title: ' + video_title);
                console.log('Clean Title: ' + clean_title);
                if (file_type === "mp3") {
                    ytdl(client_url, {
                            filter: 'audioonly'
                        })
                        .pipe(fs.createWriteStream(path.join(__dirname, '/../public/mp3/' + video_id + '.mp3')));
                } else {
                    ytdl(client_url, {
                            filter: (format) => format.container === 'mp4'
                        })
                        .pipe(fs.createWriteStream(path.join(__dirname, '/../public/mp4/' + video_id + '.mp4'))); //Changed from Clean Title!!!
                }

                console.log('The video was converted!');
                socket.emit('conversion_status', true);
                socket.emit('video_title', {
                    "title": clean_title,
                    "file_type": file_type,
                    "video_id": video_id
                });
            });
        } else {
            console.log('Video URL is invalid.');
            socket.emit('conversion_status', false);
        }
    });
    
    /*
    Chat server code
    */
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function(data) {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    socket.emit('new registered user', login_information);
    socket.emit('updated profile', login_information);

    //update dictionary of login information
    socket.on('new registered user', function(updated_login_information) {
        login_information = updated_login_information;
        fs.writeFile('../private/login_information_private.json', JSON.stringify(login_information, null, 2), 'utf-8', function(err) {
            if (err) {
                return console.log(err);
            }
            console.log('The file was saved!');
        });
    });

    //update dictionary of login information
    socket.on('updated profile', function(updated_login_information) {
        login_information = updated_login_information;
        fs.writeFile('../private/login_information_private.json', JSON.stringify(login_information, null, 2), 'utf-8', function(err) {
            if (err) {
                return console.log(err);
            }
            console.log('The file was saved!');
        });
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function() {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function() {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        if (addedUser) {
            --numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
    console.log('exiting io connection\n');
});