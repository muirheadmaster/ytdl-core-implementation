var socket = io.connect('https://user.tjhsst.edu/', {
    path: '/2018wsun/socket.io'
});
var video_url;
var video_title;
var selected_file_type;
var $loginPage = $('.login.page'); // The login page
var $converterPage = $('.converter.page'); // The converter page
var $window = $(window);
var $document = $(document);
var $body = $('body');

var $welcome = $('.welcome');//greeting after logging in


function cleanInput(input) {
    return $('<div/>').text(input).html();
}

function convertAgain() {
    console.log('entered convertAgain');

    document.getElementById('url').value='';
    document.getElementById('submit').style = "display:1;";
    document.getElementById('reload').style = "display:none;";
    document.getElementById('download').style = "display:none;";
    $('.dropboxButton').html('<a id="dropboxButton" class="dropboxButton"></a>');
    $('.dropbox_success').html('<p class="dropbox_success"></p>');
    $('.msg').html('<p class="dropbox_success"></p>');

}

function loginButton() {
    //console.log('entering loginButton');
    var $email = $('.email');
    var $password = $('.password');
    var email = cleanInput($email.val().trim());
    var password = cleanInput($password.val().trim());
    //console.log(email);
    //console.log(password);
    socket.emit('new_login',{
        "email": email,
        "password": password
    });
    
}

function loadRegistrationPage(){
    console.log('loadRegistrationPage');
    window.location.href="https://user.tjhsst.edu/2018wsun/YouTubeSaver/registration.html";
}

function loadProfilePage(){
    console.log('loadProfilePage');
    window.location.href="https://user.tjhsst.edu/2018wsun/YouTubeSaver/updateProfile.html";
}

function submitButton() {
    console.log('entering submitButton');
    var file_type = document.getElementById('file_type');
    selected_file_type = String(file_type.options[file_type.selectedIndex].value);
    var $url = $('.url');
    video_url = cleanInput($url.val().trim());
    console.log(video_url);
    socket.emit('new_url', {
        "url": video_url,
        "file_type": selected_file_type
    });
}

function logout(){
    $converterPage.fadeOut();
    $loginPage.fadeIn();
}

socket.on('login_status',function(data){
   if(data.login_status){
        console.log('successful login!');
        $loginPage.fadeOut();
        $converterPage.fadeIn();
        //$loginPage.off('click');

        $welcome.html('<p class="welcome" style="color:green;">Welcome, ' + data.email + '!</p>');
    }
    else{
        $('.errorMessage').html('<p class="errorMessage" style="color:red">Login failed. You either entered an incorrect email/password combination, or do not yet have an account. Please try again.</p>');
    } 
});

socket.on('video_title', function(data) {
    console.log('entered video_title');
    video_title = data.title;
    var file_type = data.file_type;
    var video_id = data.video_id;
    console.log(video_title);
    console.log(file_type);
    console.log(video_id);
    var url;
    if (file_type === "mp3") {
        url = "https://user.tjhsst.edu/2018wsun/mp3/" + video_id + ".mp3";
    } else {
        url = "https://user.tjhsst.edu/2018wsun/mp4/" + video_id + ".mp4";//Changed from video_title!!!
    }
    console.log(url);
    document.getElementById("download").style = "display:1;";
    document.getElementById("download").href = url;
    document.getElementById("download").download = video_title + "." + file_type;
    $('.msg').html('<p class="msg" style="color:green;">Successfully converted ' + video_title + '!</p>');
    //$('.video_title').html('<p class="video_title" >Video Title:\t' + video_title + '</p>');
    console.log(encodeURI(url));
    console.log(video_title + "." + file_type);
    var options = {
        files: [
            // You can specify up to 100 files.
            
            {
                'url': encodeURI(url),
                'filename': video_title + "." + file_type
            }
            
            // ...
        ],

        // Success is called once all files have been successfully added to the user's
        // Dropbox, although they may not have synced to the user's devices yet.
        success: function() {
            // Indicate to the user that the files have been saved.
            $('.dropbox_success').html('<p class="dropbox_success" style="color:green;">File was successfully saved to Dropbox!</p>');
            //document.getElementById('dropbox_success').innerHTML = "File was successfully saved to Dropbox!";
            //alert("Success! Files saved to your Dropbox.");
        },

        // Progress is called periodically to update the application on the progress
        // of the user's downloads. The value passed to this callback is a float
        // between 0 and 1. The progress callback is guaranteed to be called at least
        // once with the value 1.
        progress: function(progress) {},

        // Cancel is called if the user presses the Cancel button or closes the Saver.
        cancel: function() {},

        // Error is called in the event of an unexpected response from the server
        // hosting the files, such as not being able to find a file. This callback is
        // also called if there is an error on Dropbox or if the user is over quota.
        error: function(errorMessage) {}
    };
    var button = Dropbox.createSaveButton(options);
    document.getElementById("dropboxButton").appendChild(button);
    document.getElementById("dropboxButton").style="display:1;";
});

socket.on('conversion_status', function(status) {
    console.log('entered conversion_status check');
    if (status) {
        console.log('entered successful status check');
        //$('.msg').html('<p class="msg" style="color:green;">Successfully converted ' + video_title + '!</p>');
        document.getElementById('submit').style = "display:none;";
        document.getElementById('reload').style = "display:1;";
    } else {
        console.log('entered failed status check');
        $('.msg').html('<p class="msg" style="color:red;">The URL you entered could not be converted.</p>');
    }
});