function checkStoredHash(hash, user, callback) {
    socket.emit("clientHashConfirm", user, hash);
    socket.on("loginResult", (res) => {
        callback(res);
    });
}

$(document).ready(function () {
    var givenHash = sessionStorage.getItem("userHash");
    var givenUser = sessionStorage.getItem("user");
    checkStoredHash(givenHash, givenUser, (res) => {
        if (givenHash === "" || !res) {
            window.location = "./login.html";
        }
    });
});