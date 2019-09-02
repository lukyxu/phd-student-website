const fs = require('fs');
const privateKey = fs.readFileSync('/etc/letsencrypt/live/ereshchenko.com-0001/privkey.pem').toString();
const certificate = fs.readFileSync('/etc/letsencrypt/live/ereshchenko.com-0001/fullchain.pem').toString();
const ca = fs.readFileSync('/etc/letsencrypt/live/ereshchenko.com-0001/chain.pem').toString();
const app = require('https').createServer({key:privateKey,cert:certificate,ca:ca}, handler),
    io = require('socket.io').listen(app);
const mysql = require('mysql');
const config = require('./config.json');
const crypto = require('crypto');

var con = "";

function handler(req, res) {
    res.writeHead(200);
    res.end("hello world!");
}

function escapeMySQL(str) {
    if (str !== null) {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+char;
            }
        });
    }
}

function handleDisconnect() {
    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: config.sqlPassword,
        database: "website"
    });

    con.connect(function (err) {
        if (err) {
            console.log(err);
            setTimeout(handleDisconnect, 2000);
        }
    });

    con.on('error', function (err) {
        console.log(err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

function genSalt() {
    return Buffer.from(crypto.randomBytes(16)).toString('base64');
}

function getTitles(callback) {
    con.query("SELECT title FROM blog", function (err, res, fields) {
        if (err) throw err;
        callback(res);
    });
}

function getData(callback) {
    con.query("SELECT * FROM blog ORDER BY time DESC", function (err, res, fields) {
        if (err) throw err;
        callback(res);
    });
}

function editPost(title, content, callback) {
    con.query("UPDATE blog SET content = '" + escapeMySQL(content) + "' WHERE title = '" + escapeMySQL(title) + "'", (err, res) => {
        if (err) throw err;
        callback(err, res);
    });
}

function getSpecificData(title, callback) {
    con.query("SELECT content FROM blog WHERE title = '" + escapeMySQL(title) + "'", (err, res) => {
        if (err) throw err;
        callback(res);
    });
}

function deletePost(title, callback) {
    con.query("DELETE FROM blog WHERE title = '" + escapeMySQL(title) + "'", function (err, res) {
        callback(err, res);
    });
}

function createPost(title, content, callback) {
    var sql = "INSERT INTO blog (title, content, time) VALUES ?";
    var date = new Date();
    date = date.getUTCFullYear() + '-' +
        ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('00' + date.getUTCDate()).slice(-2) + ' ' +
        ('00' + date.getUTCHours()).slice(-2) + ':' +
        ('00' + date.getUTCMinutes()).slice(-2) + ':' +
        ('00' + date.getUTCSeconds()).slice(-2);
    var values = [
        [title, content, date]
    ];
    con.query(sql, [values], function (err, res) {
        if (err) throw err;
        callback(err, res);
    });
}

function getUserData(user, callback) {
    con.query("SELECT * FROM passwords WHERE user = '" + escapeMySQL(user) + "'", (err, res) => {
        if (err) throw err;
        callback(res);
    });
}

function getNonConfirmedAdmins(callback) {
    con.query("SELECT * FROM passwords WHERE isAcceptedUser = 0", (err, res) => {
        if (err) throw err;
        callback(res);
    });
}

function getConfirmedAdmins(callback) {
    con.query("SELECT * FROM passwords WHERE isAcceptedUser = 1", (err, res) => {
        if (err) throw err;
        callback(res);
    });
}

function storeUserData(user, clientSalt, serverSalt, hash, realName, isAcceptedUser, callback) {
    var sql = "INSERT INTO passwords (user, clientSalt, hash, serverSalt, name, isAcceptedUser) VALUES ?";
    var values = [[user, clientSalt, hash, serverSalt, realName, isAcceptedUser]];
    con.query(sql, [values], (err, res) => {
        callback(err, res);
    });
}

function checkIfUserExists(user, callback) {
    var sql = "SELECT * FROM passwords WHERE user = '" + escapeMySQL(user) + "'";
    con.query(sql, (err, res) => {
        if (err) throw err;
        if (res[0] === undefined) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

function calculateServerHash(clientHash, serverSalt, callback) {
    if (typeof clientHash === "string") {
        crypto.pbkdf2(clientHash, serverSalt, 100000, 64, 'sha512', (err, res) => {
            if (err) throw err;
            callback(res);
        });
    }
}

function setAdmin(user) {
    var sql = "UPDATE passwords SET isAcceptedUser = 1 WHERE user = '" + escapeMySQL(user) + "'";
    con.query(sql, (err, res) => {
        if (err) throw err;
    });
}

function deleteUser(user) {
    var sql = "DELETE FROM passwords WHERE user = '" + escapeMySQL(user) + "'";
    con.query(sql, (err, res) => {
        if (err) throw err;
    });
}

function confirmUser(user, clientHash, callback) {
    if (user === null || clientHash === null) {
        callback(false);
    }
    getUserData(user, (res) => {
        if (res[0] === undefined) {
            callback(false);
        } else {
            var serverSalt = res[0].serverSalt;
            var serverHash = res[0].hash;
            var isAcceptedUser = res[0].isAcceptedUser;
            calculateServerHash(clientHash, serverSalt, (supposedServerHash) => {
                supposedServerHash = supposedServerHash.toString('base64');
                if (supposedServerHash === serverHash && isAcceptedUser === 1) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        }
    });
}

io.sockets.on("connection", function (socket) {
    socket.on("getContent", function () {
        getData((res) => {
            socket.emit("content", res);
        });
    });

    socket.on("getSpecificContent", (title) => {
        getSpecificData(title, (res) => {
            socket.emit("returnSpecificContent", res);
        });
    });

    socket.on("editPost", (title, content, user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                editPost(title, content, (err, res) => {
                    if (err) socket.emit("postStatus", false);
                    else socket.emit("postStatus", true);
                });
            }
        });
    });

    socket.on("getTitles", (user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                getTitles((res) => {
                    socket.emit("titles", res);
                });
            }
        });
    });

    socket.on("deletePost", (title, user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                deletePost(title, (err, res) => {
                    if (err) socket.emit("deleteResponse", false);
                    else socket.emit("deleteResponse", true);
                });
            }
        });
    });

    socket.on("createPost", (title, content, user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                createPost(title, content, (err, res) => {
                    if (err) {
                        socket.emit("postStatus", false);
                    } else {
                        socket.emit("postStatus", true);
                    }
                });
            }
        });
    });

    var user = "";
    var serverHash = "";
    var serverSalt = "";
    var isAcceptedUser = 0;

    socket.on("getClientSalt", (username) => {
        user = escapeMySQL(username);
        getUserData(user, (res) => {
            if (res[0] === undefined) {
                socket.emit("loginResult", false);
            } else {
                serverHash = res[0].hash;
                serverSalt = res[0].serverSalt;
                isAcceptedUser = res[0].isAcceptedUser;
                socket.emit("sendClientSalt", res[0].clientSalt);
            }
        });
    });

    socket.on("clientHash", (clientHash) => {
        calculateServerHash(clientHash, serverSalt, (supposedServerHash) => {
            supposedServerHash = supposedServerHash.toString('base64');
            if (supposedServerHash === serverHash && isAcceptedUser === 1) {
                socket.emit("loginResult", true);
            } else {
                socket.emit("loginResult", false);
            }
        });
    });

    socket.on("clientHashConfirm", (user, clientHash) => {
        confirmUser(user, clientHash, (res) => {
            socket.emit("loginResult", res);
        });
    });

    socket.on("registerData", (user, clientSalt, clientHash, realName) => {
        var salt = genSalt();

        checkIfUserExists(user, (exists) => {
            if (exists) {
                socket.emit("regFail");
            } else {
                crypto.pbkdf2(clientHash, salt, 100000, 64, 'sha512', (err, serverHash) => {
                    if (err) throw err;
                    storeUserData(user, clientSalt, salt, serverHash.toString('base64'), realName, 0, (err, res) => {
                        if (err) throw err;
                    });
                });
                socket.emit("regSuccess");
            }
        });
    });

    socket.on("getNonConfirmedAdmins", (user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                getNonConfirmedAdmins((res) => {
                    socket.emit("nonConfirmedAdmins", res);
                });
            }
        });
    });

    socket.on("getConfirmedAdmins", (user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                getConfirmedAdmins((res) => {
                    socket.emit("confirmedAdmins", res);
                });
            }
        });
    });

    socket.on("adminLists", (checkedList, notCheckedList, user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                checkedList.forEach((elem) => {
                    setAdmin(elem);
                });
                notCheckedList.forEach((elem) => {
                    deleteUser(elem);
                });
                socket.emit("resAdminSelect", true);
            }
        });
    });

    socket.on("adminsToBeDeleted", (list, user, hash) => {
        confirmUser(user, hash, (confirm) => {
            if (confirm) {
                list.forEach((elem) => {
                    deleteUser(elem);
                });
                socket.emit("resAdminDelete", true);
            }
        });
    });
});

app.listen(8080);