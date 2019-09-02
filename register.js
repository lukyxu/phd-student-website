const socket = io.connect("https://ereshchenko.com:8080");

function deriveKey(password, salt, callback) {
    var saltBits = sjcl.codec.base64.toBits(salt);
    var derivedKey = sjcl.misc.pbkdf2(password, saltBits, 1000, 256);
    var key = sjcl.codec.base64.fromBits(derivedKey);

    return callback(key);
}

//returns a base64 encoded salt, length 24
function saltGen() {
    var array = new Uint32Array(4);
    window.crypto.getRandomValues(array);

    return sjcl.codec.base64.fromBits(array);
}

function registerSubmit() {
    var user = $("#username").val();
    var password = $("#password").val();
    var realName = $("#name").val();

    var salt = saltGen();
    console.log(salt);

    deriveKey(password, salt, (res) => {
        socket.emit("registerData", user, salt, res, realName);
    })
}

socket.on("regFail", () => {
    $(".response").html("Registration failed - user exists.");
});

socket.on("regSuccess", () => {
    $(".response").html("Registration successful - please wait to be accepted by an admin");
});