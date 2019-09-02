const socket = io.connect("https://ereshchenko.com:8080");

function deriveKey(password, salt, callback) {
    var saltBits = sjcl.codec.base64.toBits(salt);
    var derivedKey = sjcl.misc.pbkdf2(password, saltBits, 1000, 256);
    var key = sjcl.codec.base64.fromBits(derivedKey);

    return callback(key);
}

var user = "";
var password = "";
var clientHash = "";

function loginSubmit() {
    user = $("#username").val();
    password = $("#password").val();

    socket.emit("getClientSalt", user);
}

socket.on("sendClientSalt", (res) => {
    var salt = res;

    console.log("salt: " + salt);

    deriveKey(password, salt, (res) => {
        clientHash = res;
        socket.emit("clientHash", res);
    });
});

socket.on("loginResult", (res) => {
    if (res) {
        sessionStorage.setItem("userHash", clientHash);
        sessionStorage.setItem("user", user);
        window.location.href = "./admin.html"
    }
    else $(".response").html("Username or password incorrect")
})