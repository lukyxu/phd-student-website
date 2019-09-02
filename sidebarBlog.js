var counter = 0;

$(document).ready(function () {
    $('.burgericon').click(function () {
        if (counter === 0) {
            document.getElementsByClassName("sidebar")[0].style.width = "400px";
            document.getElementsByClassName("main")[0].style.marginLeft = "400px";
            document.getElementsByClassName("topbarblog")[0].style.marginLeft = "430px";
            counter++;
        } else {
            document.getElementsByClassName("sidebar")[0].style.width = "0";
            document.getElementsByClassName("main")[0].style.marginLeft = "0";
            document.getElementsByClassName("topbarblog")[0].style.marginLeft = "30px";
            counter--;
        }
    });
});
