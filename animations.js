var counter = 0;

$(document).ready(function () {
    $('.bannertext').fadeIn(1500);

    $(window).scroll(function () {
        $('.hidden').each(function () {

            var bottom_of_object = $(this).offset().top + $(this).outerHeight();
            var bottom_of_window = $(window).scrollTop() + $(window).height();

            if (bottom_of_window > bottom_of_object - $(this).outerHeight() * 0.65) {
                $(this).animate({opacity: 1}, 1000);
            }
        });
    });
    typeWriter();
});

$(window).resize(function(){
    if ($('.links').position().top + $('.links').outerHeight(true) < $('.socials').position().top + 80){
        $('.socials').css("visibility", "visible");
        console.log("show");
    }else{
        console.log("hide");
        $('.socials').css("visibility", "hidden");
    }
});

var i = 0;
var txt = '> Hello World.';
var speed = 150;
function typeWriter() {
    if (i === txt.length) {
        var blink = document.createElement('span');
        blink.className = 'blink';
        blink.innerHTML = '|';
        $('.bannertext').append(blink);
    }
    if (i < txt.length) {
        document.getElementsByClassName("bannertext")[0].innerHTML += txt.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
    }
}

function scrollToElem(place) {
    console.log("scrolling")
    $('html,body').stop().animate({
        scrollTop: $("." + place).offset().top - 30
    }, 500, 'swing');
}

if (document.getElementsByClassName('hidden').length > 0) {
    var waypoint = new Waypoint({
        element: document.getElementById('intro'),
        handler: function (direction) {
            if (direction === 'down') {
                $('.burgericon').attr('src', 'burgermenu.svg');
            } else {
                $('.burgericon').attr('src', 'burgermenuwhite.svg');
            }
        },
        offset: 150
    });

    var waypoint = new Waypoint({
        element: document.getElementById('research'),
        handler: function (direction) {
            if (direction === 'down') {
                $('.burgericon').attr('src', 'burgermenu.svg');
            } else {
                $('.burgericon').attr('src', 'burgermenuwhite.svg');
            }
        },
        offset: 80
    });

    var waypoint = new Waypoint({
        element: document.getElementById('publication'),
        handler: function (direction) {
            if (direction === 'down') {
                $('.burgericon').attr('src', 'burgermenu.svg');
            } else {
                $('.burgericon').attr('src', 'burgermenuwhite.svg');
            }
        },
        offset: 80
    });

    var waypoint = new Waypoint({
        element: document.getElementsByClassName('banner2')[0],
        handler: function (direction) {
            if (direction === 'down') {
                $('.burgericon').attr('src', 'burgermenuwhite.svg');
            } else {
                $('.burgericon').attr('src', 'burgermenu.svg');
            }
        },
        offset: 30
    });


    var waypoint = new Waypoint({
        element: document.getElementsByClassName('banner3')[0],
        handler: function (direction) {
            if (direction === 'down') {
                $('.burgericon').attr('src', 'burgermenuwhite.svg');
            } else {
                $('.burgericon').attr('src', 'burgermenu.svg');
            }
        },
        offset: 30
    })
}