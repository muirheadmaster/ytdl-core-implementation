var socket = io.connect('https://user.tjhsst.edu/', {
    path: '/2018wsun/socket.io'
});

var $window = $(window);
var $document = $(document);
var $body = $('body');

function cleanInput(input) {
    return $('<div/>').text(input).html();
}

function redirectLogin(){
    window.location.replace('https://user.tjhsst.edu/2018wsun/YouTubeSaver/YouTubeSaver.html');
}

function registerButton(){
    console.log('registerButton');
    var new_email = cleanInput($('.new_email').val().trim());
    var new_password = cleanInput($('.new_password').val().trim());
    var new_confirm_password = cleanInput($('.new_confirm_password').val().trim());
    var new_firstName = cleanInput($('.new_firstName').val().trim());
    var new_middleName = cleanInput($('.new_middleName').val().trim());
    var new_lastName = cleanInput($('.new_lastName').val().trim());
    
    console.log(new_email);
    console.log(new_password);
    console.log(new_firstName);
    console.log(new_middleName);
    console.log(new_lastName);
    
    var email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
    //console.log("satisfies email regex:\t" + email_regex.test(new_email));
    if(email_regex.test(new_email) && new_password && new_firstName && new_lastName && new_password===new_confirm_password){
        socket.emit('new_user',{
            'email': new_email,
            'password': new_password,
            'firstName': new_firstName,
            'middleName': new_middleName,
            'lastName': new_lastName
        });
    }
    else{
        $('.registrationMessage').html('<p class="registrationMessage" style="color:red">Registration failed. Please try again.</p>');
    } 
}

socket.on('registration_status',function(data){
   if(data.registration_status){
        console.log('successful registration!');
        $('.registrationMessage').html('<p class="registrationMessage" style="color:green">You have updated your profile successfully! You will be redirected to the Login page shortly.</p>');
        window.setTimeout(redirectLogin(),10000);
    }
    else{
        $('.registrationMessage').html('<p class="registrationMessage" style="color:red">Registration failed. Please try again.</p>');
    } 
});