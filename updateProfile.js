var socket = io.connect('https://user.tjhsst.edu/', {
    path: '/2018wsun/socket.io'
});

var $window = $(window);
var $document = $(document);
var $body = $('body');

function cleanInput(input) {
    return $('<div/>').text(input).html();
}

function updateProfile(){
    console.log('updateProfile');
    var profile_email = cleanInput($('.profile_email').val().trim());
    var currentPassword = cleanInput($('.currentPassword').val().trim());
    var changePassword = cleanInput($('.changePassword').val().trim());
    var confirmChangePassword = cleanInput($('.confirmChangePassword').val().trim());
    
    console.log(profile_email);
    console.log(currentPassword);
    console.log(changePassword);
    console.log(confirmChangePassword);
    
    var email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
    //console.log("satisfies email regex:\t" + email_regex.test(profile_email));

    if(email_regex.test(profile_email) && changePassword && changePassword===confirmChangePassword){
        console.log('entered successful check under profile update');
        socket.emit('update_profile',{
            'profile_email': profile_email,
            'currentPassword': currentPassword,
            'changePassword': changePassword
        });
    }
    else{
        $('.profileMessage').html('<p class="profileMessage" style="color:red">Profile update failed. Please try again.</p>');
    } 
}

function redirectLogin(){
    window.location.replace('https://user.tjhsst.edu/2018wsun/YouTubeSaver/YouTubeSaver.html');
}

socket.on('profile_status',function(data){
   if(data.profile_status){
        console.log('successful profile update!');
        $('.profileMessage').html('<p class="profileMessage" style="color:green">You have updated your profile successfully! You will be redirected to the Login page shortly.</p>');
        window.setTimeout(redirectLogin(),10000);
        //document.getElementById('redirectLogin').style = "display:1;";
    }
    else{
        $('.profileMessage').html('<p class="profileMessage" style="color:red">Profile update failed. Please try again.</p>');
    } 
});