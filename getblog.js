const socket = io.connect("https://ereshchenko.com:8080");

function previewPost() {
    var modal = document.getElementById('previewWindow');
    modal.style.display = "block";
    var span = document.getElementsByClassName("close")[0];
    createPostNoSubmit();
    span.onclick = function() {
        modal.style.display = "none";
      }
}

function previewEditPost() {
    var modal = document.getElementById('previewWindow');
    modal.style.display = "block";
    var span = document.getElementsByClassName("close")[0];
    createPostNoSubmitEdit();
    span.onclick = function() {
        modal.style.display = "none";
      }
}

function selectPostToEdit() {
    var title = $('#titleToEdit').val();
    getSpecificContent(title, (res) => {
        $('.initialForm').fadeOut();
        $('.secondaryForm').fadeIn();
        $('#editContent').val(res[0].content);
    });
}

function formatDate(date) {
    var pDate = new Date(date);
    return pDate.toLocaleDateString() + " - " + pDate.toLocaleTimeString();
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function getTitles() {
    socket.emit("getTitles", sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("titles", function (res) {
        var elements = $();
        for (x = 0; x < res.length; x++) {
            elements = elements.add('<option value="' + res[x].title + '">' + res[x].title + '</option>');
        }
        //elements.get(0).outerHTML converts jquery object to string
        $('.titles').html('<h2>Delete a post</h2> <form action = "javascript:titleSubmit()"><select id = "selectedTitle">' + jqueryToString(elements) + '</select><p style="color:red">WARNING: THIS CANNOT BE UNDONE</p><br><input class="admin" value="Delete" type="submit"></form>');
        $('.editTitles').html('<select id = "titleToEdit">' + jqueryToString(elements) + '</select>');
    });
}

function getTitlesSuccess() {
    socket.emit("getTitles", sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("titles", function (res) {
        var elements = $();
        for (x = 0; x < res.length; x++) {
            elements = elements.add('<option value="' + res[x].title + '">' + res[x].title + '</option>');
        }
        //elements.get(0).outerHTML converts jquery object to string
        $('.titles').html('<h2>Delete a post</h2> <form action = "javascript:titleSubmit()"><select id = "selectedTitle">' + jqueryToString(elements) + '</select><p style="color:red">WARNING: THIS CANNOT BE UNDONE</p><br><input class="admin" value="Delete" type="submit"></form>');
        $('.editTitles').html('<select id = "titleToEdit">' + jqueryToString(elements) + '</select>');
        $(".titles").append("Deleted successfully");
    });
}

function jqueryToString(jq) {
    var res = "";
    for (x = 0; x < jq.length; x++) {
        res = res + jq.get(x).outerHTML;
    }
    return res;
}

function titleSubmit() {
    var title = $("#selectedTitle").val();
    socket.emit("deletePost", title, sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("deleteResponse", (res) => {
        if (res) getTitlesSuccess();
        else $(".titles").append("There was an error deleting the post");
    })
}

function createPostNoSubmit() {
    var title = $("#title").val();
    var content = replaceAll($("#content").val(), "\n", "<br>");
    content = replaceAll(content, "<img>", "<div class=\"blogimage\"><img src=\"");
    content = replaceAll(content, "</img>", "\"></img></div>");
    $('.blogposttitle').html(title);
    $('.blogpostdate').html(formatDate(new Date));
    $('.blogpostcontent').html(content);
}

function createPostNoSubmitEdit() {
    var title = $("#titleToEdit").val();
    var content = replaceAll($("#editContent").val(), "\n", "<br>");
    $('.blogposttitle').html(title);
    $('.blogpostdate').html(formatDate(new Date));
    $('.blogpostcontent').html(content);
}

function editPost() {
    var title = $("#titleToEdit").val();
    var content = replaceAll($("#editContent").val(), "\n", "<br>");
    socket.emit("editPost", title, content, sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("postStatus", (err, res) => {
        if (err) {
            $(".responseEdit").html("Created post successfully");
        }
        else $(".responseEdit").html("Error creating post, please report to a developer");
    });
}

function createPost() {
    var title = $("#title").val();
    var content = replaceAll($("#content").val(), "\n", "<br>");
    content = replaceAll(content, "<img>", "<div class=\"blogimage\"><img src=\"");
    content = replaceAll(content, "</img>", "\"></img></div>");
    socket.emit("createPost", title, content, sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("postStatus", (res) => {
        if (res) {
            $(".response").html("Created post successfully");
            $("#title").val("");
            $("#content").val("");
        }
        else $(".response").html("Error creating post, please report to a developer");
    });
}

function getSpecificContent(title, callback) {
    socket.emit("getSpecificContent", title);
    socket.on("returnSpecificContent", (res) => {
        callback(res);
    });
}

function getcontent() {
    socket.emit("getContent");
    socket.on("content", function (res) {
        var elements = $();
        for (x = 0; x < res.length; x++) {
            elements = elements.add('<div class="blogpost">' + '<div class="blogposttitle">' + res[x].title.toUpperCase() + '</div><div class="blogpostdate">' +
                formatDate(res[x].time) + '</div><div class="blogpostcontent">' + res[x].content + '</div></div>');
        }
        $('.blog').html(elements);
    });
}

function submitAdmins() {
    var checkedList = new Array();
    var notCheckedList = new Array();
    $('input[class="adminSelection"]:checked').each(function () {
        checkedList.push($(this).attr("id"));
    });
    $('input[class="adminSelection"]:not(:checked)').each(function () {
        notCheckedList.push($(this).attr("id"));
    });
    socket.emit("adminLists", checkedList, notCheckedList, sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("resAdminSelect", (res) => {
        if (res) $('.responseAdminSelection').html("<span style=\"color:red\">Completed successfully</span>");
    });
}

function deleteAdmins() {
    var deletionList = new Array();
    $('input[class="adminDeletion"]:checked').each(function () {
        deletionList.push($(this).attr("id"));
    });
    socket.emit("adminsToBeDeleted", deletionList, sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("resAdminDelete", (res) => {
        if (res) $('.responseAdminDeletion').html("<span style=\"color:red\">Deleted successfully</span>");
    })
}

$(document).ready(function() {
    $('.secondaryForm').hide();
    socket.emit("getNonConfirmedAdmins", sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("nonConfirmedAdmins", (res) => {
        res.forEach((elem) => {
            $('.adminFormJQ').append("<input class=\"adminSelection\" type=\"checkbox\" id=\"" + elem.user + "\"> Real name: " + elem.name + " &emsp;Username: " + elem.user + "<br>");
        });
        $('.adminFormJQ').append("<input type=\"submit\" class=\"admin\" value=\"Apply\">");
    });
    socket.emit("getConfirmedAdmins", sessionStorage.getItem("user"), sessionStorage.getItem("userHash"));
    socket.on("confirmedAdmins", (res) => {
        res.forEach((elem) => {
            $('.adminFormRM').append("<input class=\"adminDeletion\" type=\"checkbox\" id=\"" + elem.user + "\"> Real name: " + elem.name + " &emsp;Username: " + elem.user + "<br>");
        });
        $('.adminFormRM').append("<input type=\"submit\" class=\"admin\" value=\"Apply\">");
    });
});
