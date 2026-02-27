/*
Original Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
Modifications Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

const audioUtils = require("./audioUtils"); // for encoding audio data as PCM
const crypto = require("crypto"); // tot sign our pre-signed URL
const v4 = require("./aws-signature-v4"); // to generate our pre-signed URL
const marshaller = require("@aws-sdk/eventstream-marshaller"); // for converting binary event stream messages to and from JSON
const util_utf8_node = require("@aws-sdk/util-utf8-node"); // utilities for encoding and decoding UTF8
const mic = require("microphone-stream"); // collect microphone input as a stream of raw bytes

AWS.config.region = amplifyConfig.Auth.region;


aws_amplify.Amplify.configure(amplifyConfig);

aws_amplify.Amplify.Auth.currentAuthenticatedUser().then(user => {
    //console.log('currentAuthenticatedUser', user);
    aws_amplify.Amplify.Auth.currentSession().then(data => {
        //console.log(data);
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: appConfig.IdentityPoolId, Logins: {['cognito-idp.'+amplifyConfig.Auth.region+'.amazonaws.com/'+amplifyConfig.Auth.userPoolId] : data.getIdToken().getJwtToken() }});
        AWS.config.credentials.get(function (err) {
            if (err) console.log(err);
            //  else console.log(AWS.config.credentials);
        });
        // Redirect after successful authentication check
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        
        // Check if user is on a login page and redirect to landing page
        if (currentPath == "/" || currentPath == "/index.html" || 
            currentPath === "/index.html" || currentPath === "/index-react.html") {
            // Main app login pages
            if (currentPath.includes("aws-augmentability-main")) {
                window.location.replace("/aws-augmentability-main/index-landing.html");
            } else {
                window.location.replace("/index-landing.html");
            }
        } else if (currentPath.includes("aws-augmentability-main/index-landing.html") || 
                   currentPath.endsWith("/aws-augmentability-main/index-landing.html") ||
                   currentUrl.includes("aws-augmentability-main/index-landing.html")) {
            // If on AWS AugmentAbility login page, redirect to landing page
            console.log('User already authenticated, redirecting from login to landing page');
            window.location.replace("/aws-augmentability-main/index-landing.html");
        }
    }).catch(err => {
        console.log(err);
    });
}).catch(error => {
    console.log(error);
    // Allow all pages in aws-augmentability-main folder to work without authentication
    // These are public accessibility features that don't require login
    const currentPath = window.location.pathname;
    const currentHref = window.location.href;
    const fileName = currentPath.split('/').pop() || '';
    
    // Check for AWS AugmentAbility pages by multiple methods:
    // 1. Check if path includes aws-augmentability-main directory
    // 2. Check if filename matches AWS AugmentAbility patterns (f-*.html, index-landing.html)
    // 3. Check if we're accessing from within the aws-augmentability-main context
    const isAwsAugmentabilityPage = 
        currentPath.includes('aws-augmentability-main') || 
        currentHref.includes('aws-augmentability-main') ||
        fileName.startsWith('f-') ||
        fileName === 'index-landing.html' ||
        fileName === 'index.html' && currentPath.includes('aws-augmentability-main');
    
    // Only redirect to login if it's NOT an AWS AugmentAbility page AND not the root paths
    // Allow all AWS AugmentAbility features to work without authentication
    const isRootPath = currentPath === '/' || currentPath === '/index.html' || currentPath === '/index-react.html';
    
    if (!isRootPath && !isAwsAugmentabilityPage) {
        // Only redirect non-AWS pages that aren't root paths
        window.location.pathname = "/";
    }
    
    // For AWS AugmentAbility pages, try to initialize credentials using unauthenticated Identity Pool access
    // This allows services like Transcribe to work without full user authentication
    if (isAwsAugmentabilityPage) {
        try {
            // Try to set up unauthenticated credentials from Identity Pool
            // This will work if the Identity Pool allows unauthenticated access
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: appConfig.IdentityPoolId
            });
            
            // Refresh credentials
            AWS.config.credentials.get(function (err) {
                if (err) {
                    console.log('Error getting unauthenticated credentials:', err);
                    console.log('Note: Transcribe and other AWS services may not work without authentication.');
                    console.log('To enable these features, either:');
                    console.log('1. Enable unauthenticated access in your Cognito Identity Pool, or');
                    console.log('2. Sign in to authenticate and get credentials');
                } else {
                    console.log('Unauthenticated credentials initialized successfully');
                }
            });
        } catch (credError) {
            console.log('Could not initialize unauthenticated credentials:', credError);
        }
    }
});

// Set up sign-in handler when jQuery and DOM are ready
function setupSignInHandler() {
    // Check if jQuery is available
    if (typeof $ === 'undefined') {
        setTimeout(setupSignInHandler, 100);
        return;
    }
    
    // Wait for DOM to be ready
    $(document).ready(function() {
        // Check if sign-in button exists on this page
        var signInButton = $("#sign-in");
        if (signInButton.length === 0) {
            // Sign-in button doesn't exist on this page, skip setup
            return;
        }
        
        // Remove any existing click handlers to avoid duplicates
        signInButton.off('click');
        
        // Attach click handler
        signInButton.click(function () {
            var username = document.getElementById("username").value;
            var pass = document.getElementById("pwd").value;
            
            if (!username || !pass) {
                alert("Please enter both username and password.");
                return;
            }
            
            // Disable button during sign-in attempt
            signInButton.prop('disabled', true);
            signInButton.text('Signing in...');
            
            aws_amplify.Amplify.Auth.signIn(username, pass)
                .then(user => {
                    console.log('Sign in successful:', user);
                    signInButton.text('Sign in successful! Redirecting...');
                    
                    // Redirect immediately - don't wait for session
                    // Session will be checked on the landing page
                    const currentPath = window.location.pathname;
                    const currentUrl = window.location.href;
                    
                    console.log('Current path:', currentPath);
                    console.log('Current URL:', currentUrl);
                    
                    // Always redirect to landing page after successful sign-in
                    console.log('Redirecting to landing page immediately...');
                    
                    // Use a small timeout to ensure sign-in is fully processed
                    setTimeout(function() {
                        window.location.href = "/aws-augmentability-main/index-landing.html";
                    }, 500);
                    
                    // Also try to set up session in the background (non-blocking)
                    aws_amplify.Amplify.Auth.currentSession()
                        .then(data => {
                            console.log('Session retrieved successfully');
                            // Set up AWS credentials in background
                            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                                IdentityPoolId: appConfig.IdentityPoolId, 
                                Logins: {
                                    ['cognito-idp.'+amplifyConfig.Auth.region+'.amazonaws.com/'+amplifyConfig.Auth.userPoolId]: data.getIdToken().getJwtToken()
                                }
                            });
                            AWS.config.credentials.get(function (err) {
                                if (err) {
                                    console.error('Error getting credentials:', err);
                                } else {
                                    console.log('AWS credentials set successfully');
                                }
                            });
                        })
                        .catch(sessionError => {
                            console.warn('Could not get session immediately (will retry on landing page):', sessionError);
                            // This is okay - session will be checked on landing page
                        });
                })
                .catch(error => {
                    console.error('Sign in error:', error);
                    // Re-enable button on error
                    signInButton.prop('disabled', false);
                    signInButton.text('Sign In');
                    alert("Error signing in: " + (error.message || error));
                });
        });
        
        console.log('Sign-in handler attached successfully');
    });
}

// Start setting up sign-in handler
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSignInHandler);
} else {
    // DOM already loaded
    setupSignInHandler();
}


/**
 * Amazon Cognito credentials provider initilization in case no Cognito User Pool is used 
 */

/*
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: appConfig.IdentityPoolId,
});

// As of v2.1.20 the credentials are fetched lazily when a request is made. To explicitly get credentials you can use AWS.Credentials.get()
AWS.config.credentials.get(function (err) {
    if (err) console.log(err);
    //  else console.log(AWS.config.credentials);
});
*/


/**
 * Variables initilization
 */

// converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
    util_utf8_node.toUtf8,
    util_utf8_node.fromUtf8
);

let languageCode;
let region = amplifyConfig.Auth.region;
let sampleRate;
let inputSampleRate;
let transcription = "";
let socket;
let micStream;
let socketError = false;
let transcribeException = false;
let translation = "";
let translation2 = "";
let translated;
let detectedText = "";

const pollyNeuralVoices = ["Vicki", "Gabrielle", "Lupe", "Lucia", "Olivia", "Amy", "Emma", "Brian", "Aria", "Ayanda", "Ivy", "Joanna", "Kendra", "Kimberly", "Salli", "Joey", "Justin", "Kevin", "Matthew", "Bianca", "Seoyeon", "Camila", "Lucia", "Lea", "Takumi", "Kajal", "Zhiyu", "Zeina", "Arlet", "Jitka", "Sofie", "Aria", "Ayanda", "Suvi", "Sabrina", "Ola", "Ines", "Elin", "Zayd"];

const pollyNeuralVoicesRegions = ["us-east-1", "us-west-2", "af-south-1", "ap-northeast-1", "ap-northeast-2", "ap-northeast-3", "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "us-gov-west-1"];

const pollyGenerativeVoices = ["Vicki", "Bianca", "Lupe", "Mia", "Lucia", "Lea", "Joanna", "Amy", "Olivia", "Kajal", "Ayanda"];
const pollyGenerativeRegions = ["us-east-1", "us-west-2", "eu-central-1"];

const pollyVoiceMap = new Map();
pollyVoiceMap.set("ar", "Zayd");
pollyVoiceMap.set("arb", "Zeina");
pollyVoiceMap.set("ar-AE", "Zayd");
pollyVoiceMap.set("zh", "Zhiyu");
pollyVoiceMap.set("zh-TW", "Zhiyu");
pollyVoiceMap.set("da", "Mads");
pollyVoiceMap.set("nl", "Ruben");
pollyVoiceMap.set("en", "Joey");
pollyVoiceMap.set("en-US", "Joanna");
pollyVoiceMap.set("en-GB", "Amy");
pollyVoiceMap.set("en-AU", "Olivia");
pollyVoiceMap.set("en-IN", "Kajal");
pollyVoiceMap.set("en-ZA", "Ayanda");
pollyVoiceMap.set("fr", "Mathieu");
pollyVoiceMap.set("fr-CA", "Chantal");
pollyVoiceMap.set("fr-FR", "Lea");
pollyVoiceMap.set("de", "Vicki");
pollyVoiceMap.set("is", "Karl");
pollyVoiceMap.set("it", "Bianca");
pollyVoiceMap.set("ja", "Takumi");
pollyVoiceMap.set("ko", "Seoyeon");
pollyVoiceMap.set("no", "Liv");
pollyVoiceMap.set("pl", "Jacek");
pollyVoiceMap.set("pt", "Cristiano");
pollyVoiceMap.set("ro", "Carmen");
pollyVoiceMap.set("ru", "Maxim");
pollyVoiceMap.set("es", "Conchita");
pollyVoiceMap.set("es-MX", "Mia");
pollyVoiceMap.set("es-US", "Lupe");
pollyVoiceMap.set("es-ES", "Lucia");
pollyVoiceMap.set("sv", "Astrid");
pollyVoiceMap.set("tr", "Filiz");
pollyVoiceMap.set("cy", "Gwyneth");
pollyVoiceMap.set("pt-BR", "Camila");
pollyVoiceMap.set("de-DE", "Vicki");
pollyVoiceMap.set("ja-JP", "Takumi");
pollyVoiceMap.set("it-IT", "Bianca");
pollyVoiceMap.set("ko-KR", "Seoyeon");
pollyVoiceMap.set("zh-CN", "Zhiyu");
pollyVoiceMap.set("ca-ES", "Arlet");
pollyVoiceMap.set("cs-CZ", "Jitka");
pollyVoiceMap.set("da-DK", "Sofie");
pollyVoiceMap.set("en-IN", "Kajal");
pollyVoiceMap.set("en-NZ", "Aria");
pollyVoiceMap.set("en-ZA", "Ayanda");
pollyVoiceMap.set("fi-FI", "Suvi");
pollyVoiceMap.set("de-CH", "Sabrina");
pollyVoiceMap.set("pl-PL", "Ola");
pollyVoiceMap.set("pt-PT", "Ines");
pollyVoiceMap.set("ro-RO", "Carmen");
pollyVoiceMap.set("ru-RU", "Maxim");
pollyVoiceMap.set("sv-SE", "Elin");


if (pollyNeuralVoicesRegions.includes(region)) {
    pollyVoiceMap.set("hi-IN", "Kajal"); // only Neural voice, no Standard voice
    pollyVoiceMap.set("en-IN", "Kajal"); // only Neural voice and Generative voice, no Standard voice
} else {
    pollyVoiceMap.set("hi-IN", "Aditi");
    pollyVoiceMap.set("en-IN", "Aditi");
}

// Declare webcam globally so it can be accessed by click handlers
var webcam = null;
var queryString = window.location.search;

// Initialize camera when DOM and jQuery are ready
function initializeCamera() {
    queryString = window.location.search; // Update queryString
    
    // Only initialize if there's a query string and not upload document page
    if (queryString == "" || window.location.href.includes("f-see-upload-document")) {
        return;
    }

    const webcamElement = document.getElementById("webcam");
    const canvasElement = document.getElementById("canvas");
    const snapSoundElement = document.getElementById("snapSound");

    // Check if Webcam class is available
    if (typeof Webcam === 'undefined') {
        console.error('Webcam class not loaded');
        setTimeout(initializeCamera, 100);
        return;
    }

    // Check if jQuery is available
    if (typeof $ === 'undefined') {
        setTimeout(initializeCamera, 100);
        return;
    }

    // Check if DOM elements exist
    if (!webcamElement || !canvasElement || !snapSoundElement) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeCamera);
        } else {
            setTimeout(initializeCamera, 100);
        }
        return;
    }

    // All prerequisites met, initialize camera
    try {
        webcam = new Webcam(
            webcamElement,
            "user",
            canvasElement,
            snapSoundElement
        );
        $(".md-modal").addClass("md-show");
        webcam
            .start()
            .then((result) => {
                cameraStarted();
            })
            .catch((err) => {
                console.error('Camera start error:', err);
                displayError(err);
            });
    } catch (error) {
        console.error('Error initializing webcam:', error);
        displayError(error.message || 'Failed to initialize camera');
    }
}

// Start initialization when DOM and jQuery are ready
function setupCameraWhenReady() {
    // Wait for jQuery to be available
    if (typeof $ === 'undefined') {
        setTimeout(setupCameraWhenReady, 100);
        return;
    }
    
    // Use jQuery ready to ensure DOM is fully loaded
    $(document).ready(function() {
        // Small delay to ensure all scripts are loaded
        setTimeout(function() {
            initializeCamera();
        }, 200);
    });
}

// Start the setup process
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCameraWhenReady);
} else {
    // DOM already loaded
    setupCameraWhenReady();
}

if (window.location.href.includes("f-see-upload-document")) {


    const image_input = document.querySelector("#image-input");

    image_input.addEventListener("change", function() {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const uploaded_image = reader.result;
        document.querySelector("#display-image").style.backgroundImage = `url(${uploaded_image})`;


        //Call Textract
        var textract = new AWS.Textract();
        var params = {
          Document: { 
            Bytes: new Buffer(uploaded_image.replace(/^[\w\d;:\/]+base64\,/g, ''), 'base64'),
          }
        };                

        textract.detectDocumentText(params, function (err, data) {
            if (err) console.log(err, err.stack);
            // an error occurred
            else {
                var string = "";
                var stringHTML = "";
                for (var i = 0; i < data.Blocks.length; i++) {
                    if (data.Blocks[i].BlockType == "LINE") {
                        string += data.Blocks[i].Text + ", ";
                        stringHTML += data.Blocks[i].Text + "\r\n";
                        //stringHTML += data.Blocks[i].Text + " ";
                    }
                }

                if (string != "") {
                    string = string.substring(0, string.length - 1);
                    stringHTML = stringHTML.substring(0, stringHTML.length - 1);
                    var urlParams = new URLSearchParams(queryString);
                    var languageFromURL = urlParams.get("language");
                    document.getElementById("show-text").style.display = "block";
                    document.getElementById("detectedText").style.display = "block";
                    document.getElementById("detectedTextAlert").style.display = "none";
                    document.getElementById("detectedText").value = stringHTML;
                    detectedText = stringHTML;
                    document.getElementById("translate-dyslexic-div").style.display = "block";
                    if (languageFromURL == "ar" || languageFromURL == "arb" || languageFromURL == "ar-AE") {
                        $("#detectedText").css("direction", "rtl");
                    } else {
                        $("#detectedText").css("direction", "ltr");
                    }                            
                    speakDetectedTextFromWebcam(string, languageFromURL);
                } else {
                    document.getElementById("show-text").style.display = "block";
                    document.getElementById("detectedTextAlert").style.display = "block";
                    document.getElementById("translate-dyslexic-div").style.display = "none";
                    document.getElementById("detectedText").style.display = "none";
                    document.getElementById("detectedTextAlert").innerHTML = "No text detected. Please try again!";
                    speakDetectedTextFromWebcam("No text detected. Please try again!", "en-US");
                }
            }
        });

      });
      reader.readAsDataURL(this.files[0]);
    });
}


//  Check to see if the browser allows mic access
if (!window.navigator.mediaDevices.getUserMedia) {
    showError(
        "We support the latest versions of Chrome, Firefox, Safari, and Edge. Update your browser and try your request again."
    );
}


/**
 * Click and Change events handling
 */

$("#start-button").click(function () {
    $("#error").hide(); // hide any existing errors
    
    // Check if AWS credentials are initialized before starting
    if (!AWS.config.credentials) {
        // Try to initialize unauthenticated credentials
        try {
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: appConfig.IdentityPoolId
            });
        } catch (credError) {
            showError("AWS credentials not available. Please refresh the page or sign in to use Transcribe.");
            return;
        }
    }
    
    // Check if getUserMedia is available
    if (!window.navigator.mediaDevices || !window.navigator.mediaDevices.getUserMedia) {
        showError("Your browser doesn't support microphone access. Please use a modern browser like Chrome, Firefox, or Edge.");
        return;
    }
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname === '';
    const isSecure = window.isSecureContext || isLocalhost;
    
    if (!isSecure) {
        showError("Microphone access requires HTTPS. Please access this page over HTTPS.");
        return;
    }
    
    toggleStartStop(); // disable start and enable stop button
    setLanguage(); // set the language and region from the dropdowns
    document.getElementById("listening-animation").style.display = "flex";
    
    window.navigator.mediaDevices
        .getUserMedia({
            // first we get the microphone input from the browser (as a promise)
            video: false,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
        })
        .then(streamAudioToWebSocket) // we convert the mic stream to binary event stream messages when the promise resolves
        .catch(function (error) {
            console.error('Error getting user media:', error);
            let errorMessage = "There was an error accessing your microphone. ";
            
            // Provide more specific error messages based on error type
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += "Please allow microphone access in your browser settings and try again.";
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += "No microphone found. Please connect a microphone and try again.";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += "Microphone is already in use by another application. Please close other applications using the microphone and try again.";
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage += "Microphone doesn't support the required settings. Please try a different microphone.";
            } else {
                errorMessage += "Error: " + (error.message || error.name || "Unknown error") + ". Please check permissions and try again.";
            }
            
            showError(errorMessage);
            toggleStartStop();
            document.getElementById("listening-animation").style.display = "none";
        });
});

$("#start-conversation-button").click(function () {
    $("#error").hide(); // hide any existing errors
    document.getElementById("audioSource").src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    document.getElementById("audioPlayback").load();
    toggleStartStopConversation(); // disable start and enable stop button
    setLanguage(); // set the language and region from the dropdowns
    window.navigator.mediaDevices
        .getUserMedia({
            // first we get the microphone input from the browser (as a promise)
            video: false,
            audio: true,
        })
        .then(streamAudioToWebSocket) // we convert the mic stream to binary event stream messages when the promise resolves
        .catch(function (error) {
            showError(
                "There was an error streaming your audio to Amazon Transcribe. Please try again."
            );
            toggleStartStopConversation();
        });
    document.getElementById("listening-animation").style.display = "flex";
});

$("#stop-button").click(function () {
    closeSocket();
    toggleStartStop();
    document.getElementById("listening-animation").style.display = "none";
});

$("#reset-button").click(function () {
    $("#transcript").val("");
    transcription = "";
    $("#translate").val("");
    translation = "";
});

$("#reset-button-2").click(function () {
    $("#translate2").val("");
    translation2 = "";
});

$("#play-button").click(function () {
    speakText();
});

$("#translate-play-button").click(function () {
    translateSpeakText();
});

$("#switch-language-button").click(function () {
    if (document.getElementById("stop-conversation-button").style.display === "block") // if listening
        document.getElementById("stop-conversation-button").click();
    let language0 = document.getElementById("language").selectedIndex;
    let translateTo0 = document.getElementById("translateTo").selectedIndex;
    document.getElementById("language").selectedIndex = translateTo0;
    document.getElementById("translateTo").selectedIndex = language0;
    disableLanguage();
    formatTranslate();
    const myTimeout = setTimeout(function() {resetListenTextAreas();}, 1000);
});

$("#language").change(function () {
    if (typeof document.getElementById("stop-button")!= "undefined" && document.getElementById("stop-button")!= null) // if feature 1 or 2
        if (document.getElementById("stop-button").style.display === "block") { // if listening
        document.getElementById("stop-button").click(); // stop listening
    } 

    if (typeof document.getElementById("stop-conversation-button")!= "undefined" && document.getElementById("stop-conversation-button")!= null) // if feature 3
        if (document.getElementById("stop-conversation-button").style.display === "block") { // if listening
        document.getElementById("stop-conversation-button").click(); // stop listening
    }

    const myTimeout = setTimeout(function() {resetListenTextAreas(); resetSpeakTextArea();}, 1000);

    disableLanguage();

    if (document.getElementById("textToSynth")) {
        if ($("#language").find(":selected").val() == "auto") {
            document.getElementById("textToSynth").style.display = "none";
            if (window.location.href.indexOf("f-hear-speak.html") != -1)
                document.getElementById("textToSynth-not-ready").style.display = "block";
        }
        else {
            document.getElementById("textToSynth").style.display = "block";
            
            if ($("#language").find(":selected").val() == "ar-AE") {
                $("#transcript").css("direction", "rtl");
                if (window.location.href.indexOf("f-hear-speak.html") != -1)
                    $("#textEntry").css("direction", "rtl");
                if (window.location.href.indexOf("f-hear-speak-translate.html") != -1)
                    $("#translate2").css("direction", "rtl");
            } else {
                $("#transcript").css("direction", "ltr");
                if (window.location.href.indexOf("f-hear-speak.html") != -1)
                    $("#textEntry").css("direction", "ltr");
                if (window.location.href.indexOf("f-hear-speak-translate.html") != -1)
                    $("#translate2").css("direction", "ltr");                
            }                            

            if (window.location.href.indexOf("f-hear-speak.html") != -1)
                document.getElementById("textToSynth-not-ready").style.display = "none";
        }
    }
});

$("#translateTo").change(function () {

    if (typeof document.getElementById("stop-button")!= "undefined" && document.getElementById("stop-button")!= null) // if feature 1 or 2
        if (document.getElementById("stop-button").style.display === "block") { // if listening
        document.getElementById("stop-button").click(); // stop listening
    } 

    if (typeof document.getElementById("stop-conversation-button")!= "undefined" && document.getElementById("stop-conversation-button")!= null) // if feature 3
        if (document.getElementById("stop-conversation-button").style.display === "block") { // if listening
        document.getElementById("stop-conversation-button").click(); // stop listening
    }

    if ($("#translateTo").find(":selected").val() == "ar" || $("#translateTo").find(":selected").val() == "he") {
        if (window.location.href.indexOf("f-hear-speak-translate.html") != -1)
            $("#textEntry").css("direction", "rtl");
    } else {
        if (window.location.href.indexOf("f-hear-speak-translate.html") != -1)
            $("#textEntry").css("direction", "ltr");
    }                            

    const myTimeout = setTimeout(function() {resetListenTextAreas(); resetSpeakTextArea();}, 1000);

    formatTranslate();
});

$("#stop-conversation-button").click(function () {
    closeSocket();
    toggleStartStopConversation();
    document.getElementById("listening-animation").style.display = "none";
    setTimeout(() => { conversationSpeak(); }, 1000);
});

$("#hide-container").click(function () {
    if (typeof document.getElementById("text-container") != "undefined" && document.getElementById("text-container") != null)
        document.getElementById("text-container").style.display = "none";
});

$("#show-text").click(function () {
    document.getElementById("text-container").style.display = "block";
});

$("#translateTextTo").change(function () {
    var urlParams = new URLSearchParams(queryString);
    var translate = new AWS.Translate();
    var target_language = $("#translateTextTo")
        .find(":selected")
        .val()
        .substring(0, 2);
    var params = {
        SourceLanguageCode: urlParams.get("language").substring(0, 2),
        TargetLanguageCode: target_language,
        Text: detectedText,
    };
    translate.translateText(params, function (err, data) {
        if (err) console.log(err, err.stack); 
        else {
            document.getElementById("detectedText").value = data['TranslatedText'];
            if (target_language == "he" || target_language == "ar" || target_language == "arb"|| target_language == "ar-AE") {
                $("#detectedText").css("direction", "rtl");
            } else {
                $("#detectedText").css("direction", "ltr");
            }
        }
    });
});

$("#dyslexic-button").click(function () {
    if (document.getElementById("detectedText").style.fontFamily != 'Open-Dyslexic')
        document.getElementById("detectedText").style.fontFamily = 'Open-Dyslexic';
    else 
        document.getElementById("detectedText").style.fontFamily = window.getComputedStyle(document.createElement('detectedText')).fontFamily;
});

$("#btn-increase").click(function(){
    document.getElementById("detectedText").style.fontSize = "larger";
})

$("#btn-decrease").click(function(){
    document.getElementById("detectedText").style.fontSize = "smaller";
})

$("#btn-orig").click(function(){
    document.getElementById("detectedText").style.fontSize = "initial";
})


/**
 * Some more initialization tasks
 */

let streamAudioToWebSocket = function (userMediaStream) {
    // Verify we actually have a media stream
    if (!userMediaStream) {
        showError("Failed to get microphone stream. Please check your microphone and try again.");
        toggleStartStop();
        document.getElementById("listening-animation").style.display = "none";
        return;
    }
    
    // Check if AWS credentials are available
    if (!AWS.config.credentials) {
        // Try to initialize credentials first
        try {
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: appConfig.IdentityPoolId
            });
        } catch (credError) {
            console.error('Error initializing credentials:', credError);
            showError("AWS credentials not initialized. Please refresh the page or sign in to use Transcribe.");
            toggleStartStop();
            document.getElementById("listening-animation").style.display = "none";
            // Stop the media stream
            if (userMediaStream) {
                userMediaStream.getTracks().forEach(track => track.stop());
            }
            return;
        }
    }
    
    // Ensure credentials are fresh
    AWS.config.credentials.get(function (err) {
        if (err) {
            console.error('Error getting AWS credentials:', err);
            showError("Failed to get AWS credentials. Please refresh the page or sign in to use Transcribe.");
            toggleStartStop();
            document.getElementById("listening-animation").style.display = "none";
            // Stop the media stream
            if (userMediaStream) {
                userMediaStream.getTracks().forEach(track => track.stop());
            }
            return;
        }
        
        // Credentials are ready, proceed with streaming
        try {
            micStream = new mic(); //let's get the mic input from the browser, via the microphone-stream module

            micStream.on("format", function (data) {
                inputSampleRate = data.sampleRate;
            });

            micStream.setStream(userMediaStream);

            let url = createPresignedUrl(); // Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
            
            if (!url) {
                showError("Failed to create presigned URL. Please check your AWS configuration.");
                toggleStartStop();
                return;
            }
            
            socket = new WebSocket(url); // open up our WebSocket connection
            socket.binaryType = "arraybuffer";
            let sampleRate = 0;
            socket.onopen = function () {
                // when we get audio data from the mic, send it to the WebSocket if possible
                micStream.on("data", function (rawAudioChunk) {
                    let binary = convertAudioToBinaryMessage(rawAudioChunk); // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
                    if (socket.readyState === socket.OPEN) socket.send(binary);
                });
            };
            wireSocketEvents(); // handle messages, errors, and close events
        } catch (error) {
            console.error('Error setting up WebSocket stream:', error);
            showError("Error setting up audio stream: " + (error.message || error));
            toggleStartStop();
        }
    });
};

function setLanguage() {
    languageCode = $("#language").find(":selected").val();
    sampleRate = 44100;
}

function disableLanguage() {
    var currentLanguage;
    currentLanguage = $("#language").find(":selected").val().substring(0, 2);
    $("#translateTo option").each(function (index, element) {
        if (currentLanguage == element.value) {
            $(this).prop("disabled", true);
        } else {
            $(this).prop("disabled", false);
        }
    });
}

function formatTranslate() {
    var currentLanguage = $("#translateTo").find(":selected").val();
    if (currentLanguage == "he" || currentLanguage == "ar" || currentLanguage == "arb" || currentLanguage == "ar-AE") {
        $("#translate").css("direction", "rtl");
    } else {
        $("#translate").css("direction", "ltr");
    }
}

function resetListenTextAreas() {
    $("#transcript").val("");
    transcription = "";
    $("#translate").val("");
    translation = "";
}

function resetSpeakTextArea() {
    $("#translate2").val("");
    translation2 = "";
}



/**
 * Functions for "Live transcription and text-to-speeech", "Live transcription and text-to-speeech with translation" features
 */

function speakText() {
    setLanguage();

    if (typeof pollyVoiceMap.get(languageCode) === "undefined") {
        document.getElementById("result").innerHTML =
            "The language you selected is not available for text-to-speech";
        return;
    }

    var voiceId = pollyVoiceMap.get(languageCode);

    // Create the JSON parameters for getSynthesizeSpeechUrl
    var speechParams = {
        OutputFormat: "mp3",
        Text: "",
        TextType: "text",
        VoiceId: voiceId,
        Engine: "standard"
    };

    if (pollyNeuralVoices.includes(voiceId) && pollyNeuralVoicesRegions.includes(region)) 
        speechParams.Engine = "neural";
    
    if (pollyGenerativeVoices.includes(voiceId) && pollyGenerativeRegions.includes(region)) 
        speechParams.Engine = "generative";

    speechParams.Text = document.getElementById("textEntry").value;

    // Create the Polly service object and presigner object
    var polly = new AWS.Polly({ apiVersion: "2016-06-10" });
    var signer = new AWS.Polly.Presigner(speechParams, polly);

    // Create presigned URL of synthesized speech file
    signer.getSynthesizeSpeechUrl(speechParams, function (error, url) {
        if (error) {
            document.getElementById("result").innerHTML = "Oops! Something went wrong.";
            console.log(error);
        } else {
            document.getElementById("audioSource").src = url;
            if (document.getElementById("audioPlayback").style.display === "none")
                document.getElementById("audioPlayback").style.display = "block";
            document.getElementById("audioPlayback").load();
            //document.getElementById("result").innerHTML = "Ready!";
        }
    });
}

function translateSpeakText() {
    $("#translate2").val("");
    setLanguage();

    if (typeof pollyVoiceMap.get(languageCode) === "undefined") {
        document.getElementById("result").innerHTML =
            "The language you selected is not available for text-to-speech";
        return;
    }

    var voiceId = pollyVoiceMap.get(languageCode);

    // Create the JSON parameters for getSynthesizeSpeechUrl
    var speechParams = {
        OutputFormat: "mp3",
        Text: "",
        TextType: "text",
        VoiceId: voiceId,
        Engine: "standard"
    };

    if (pollyNeuralVoices.includes(voiceId) && pollyNeuralVoicesRegions.includes(region)) 
        speechParams.Engine = "neural";
    
    if (pollyGenerativeVoices.includes(voiceId) && pollyGenerativeRegions.includes(region)) 
        speechParams.Engine = "generative";
    translation2 = "";
    
    translateInputReverse(
        document.getElementById("textEntry").value,
        function (translated) {
            translation2 += translated + "\n";
            $("#translate2").val(translation2 + "\n");
            $('#translate2').scrollTop($('#translate2')[0].scrollHeight);
            speechParams.Text = translation2;

            // Create the Polly service object and presigner object
            var polly = new AWS.Polly({ apiVersion: "2016-06-10" });
            var signer = new AWS.Polly.Presigner(speechParams, polly);

            // Create presigned URL of synthesized speech file
            signer.getSynthesizeSpeechUrl(speechParams, function (error, url) {
                if (error) {
                    document.getElementById("result").innerHTML = "Oops! Something went wrong.";
                } else {
                    document.getElementById("audioSource").src = url;
                    if (document.getElementById("audioPlayback").style.display === "none")
                        document.getElementById("audioPlayback").style.display = "block";
                    document.getElementById("audioPlayback").load();
                    //document.getElementById("result").innerHTML = "Ready!";
                }
            });
        }
    );
}

/**
 * Functions for "Real-time conversation translation" feature
 */

function conversationSpeak() {
    if (typeof pollyVoiceMap.get(
            $("#translateTo").find(":selected").val()
        ) === "undefined"
    ) {
        document.getElementById("result").innerHTML =
            "The language you selected is not available for text-to-speech";
        return;
    }

    var voiceId = pollyVoiceMap.get(
        $("#translateTo").find(":selected").val()
    );

    // Create the JSON parameters for getSynthesizeSpeechUrl
    var speechParams = {
        OutputFormat: "mp3",
        Text: translation,
        TextType: "text",
        VoiceId: voiceId,
        Engine: "standard"
    };

    if (pollyNeuralVoices.includes(voiceId) && pollyNeuralVoicesRegions.includes(region)) 
        speechParams.Engine = "neural";
    
    if (pollyGenerativeVoices.includes(voiceId) && pollyGenerativeRegions.includes(region)) 
        speechParams.Engine = "generative";

    // Create the Polly service object and presigner object
    var polly = new AWS.Polly({ apiVersion: "2016-06-10" });
    var signer = new AWS.Polly.Presigner(speechParams, polly);

    // Create presigned URL of synthesized speech file
    signer.getSynthesizeSpeechUrl(speechParams, function (error, url) {
        if (error) {
            document.getElementById("result").innerHTML = "Oops! Something went wrong.";
        } else {
            document.getElementById("audioSource").src = url;
            if (document.getElementById("audioPlayback").style.display === "none")
                document.getElementById("audioPlayback").style.display = "block";
            document.getElementById("audioPlayback").load();
        }
    });
}

function wireSocketEvents() {
    // handle inbound messages from Amazon Transcribe
    socket.onmessage = function (message) {
        //convert the binary event stream message to JSON
        let messageWrapper = eventStreamMarshaller.unmarshall(
            Buffer(message.data)
        );
        let messageBody = JSON.parse(
            String.fromCharCode.apply(String, messageWrapper.body)
        );
        if (messageWrapper.headers[":message-type"].value === "event") {
            handleEventStreamMessage(messageBody);
        } else {
            transcribeException = true;
            showError(messageBody.Message);
            toggleStartStop();
        }
    };

    socket.onerror = function () {
        socketError = true;
        showError("WebSocket connection error. Try again.");
        toggleStartStop();
    };

    socket.onclose = function (closeEvent) {
        micStream.stop();

        // the close event immediately follows the error event; only handle one.
        if (!socketError && !transcribeException) {
            if (closeEvent.code != 1000) {
                showError(
                    "</i><strong>Streaming Exception</strong><br>" +
                        closeEvent.reason
                );
                toggleStartStop();
            }
        }
    };
}

let handleEventStreamMessage = function (messageJson) {
    let results = messageJson.Transcript.Results;
    if (results.length > 0) {
        if (results[0].Alternatives.length > 0) {
            //location.href = "#";
            //location.href = "#transcription-div";
            let languageCodeFromStream = "";
            //console.log(results[0]);
            if (typeof results[0].LanguageCode != "undefined" && languageCodeFromStream != results[0].LanguageCode) {
                languageCodeFromStream = results[0].LanguageCode;
                //console.log(languageCodeFromStream);
                let languageSelectionElement = document.getElementById("language");
                languageSelectionElement.value = languageCodeFromStream;
                document.getElementById("textToSynth").style.display = "block";
                if (window.location.href.indexOf("f-hear-speak.html") != -1)
                    document.getElementById("textToSynth-not-ready").style.display = "none";
            }
            let transcript = results[0].Alternatives[0].Transcript;

            // fix encoding for accented characters
            transcript = decodeURIComponent(escape(transcript));

            // update the textarea with the latest result
            $("#transcript").val(transcription + transcript + "\n");
            $('#transcript').scrollTop($('#transcript')[0].scrollHeight);

            // if this transcript segment is final, add it to the overall transcription
            if (!results[0].IsPartial) {
                $('#transcript').scrollTop($('#transcript')[0].scrollHeight);
                transcription += transcript + "\n";

                if (typeof document.getElementById("translateTo") != "undefined" && document.getElementById("translateTo") != null)
                    translateInput(transcript, function (translated) {
                        //location.href = "#";
                        //location.href = "#translate-div";
                        translation += translated + "\n";
                        $("#translate").val(translation + "\n");
                        $('#translate').scrollTop($('#translate')[0].scrollHeight);
                    });
            }
        }
    }
};

let closeSocket = function () {
    if (socket.readyState === socket.OPEN) {
        micStream.stop();

        // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
        let emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));
        let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
        socket.send(emptyBuffer);
    }
};

function translateInput(text, callback) {
    var source_language = "auto";
    var target_language = $("#translateTo")
        .find(":selected")
        .val()
        .substring(0, 2);

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("language")) {
        var target_language = urlParams.get("language");
    }

    var translate = new AWS.Translate();
    var params = {
        SourceLanguageCode: source_language,
        TargetLanguageCode: target_language,
        Text: text,
    };
    translate.translateText(params, function (err, data) {
        callback(data.TranslatedText);
    });
}

function translateInputReverse(text, callback) {
    var source_language = $("#translateTo")
        .find(":selected")
        .val()
        .substring(0, 2);
    var target_language = $("#language")
        .find(":selected")
        .val()
        .substring(0, 2);

    var translate = new AWS.Translate();
    var params = {
        SourceLanguageCode: source_language,
        TargetLanguageCode: target_language,
        Text: text,
    };
    translate.translateText(params, function (err, data) {
        callback(data.TranslatedText);
    });
}

function toggleStartStop() {
    if (document.getElementById("start-button").style.display === "none") {
        document.getElementById("start-button").style.display = "block";
    } else {
        document.getElementById("start-button").style.display = "none";
    }

    if (document.getElementById("stop-button").style.display === "none") {
        document.getElementById("stop-button").style.display = "block";
    } else {
        document.getElementById("stop-button").style.display = "none";
    }
}

function toggleStartStopConversation(disableStart = false) {
    if (
        document.getElementById("start-conversation-button").style.display ===
        "none"
    ) {
        document.getElementById("start-conversation-button").style.display =
            "block";
    } else {
        document.getElementById("start-conversation-button").style.display =
            "none";
    }

    if (
        document.getElementById("stop-conversation-button").style.display ===
        "none"
    ) {
        document.getElementById("stop-conversation-button").style.display =
            "block";
    } else {
        document.getElementById("stop-conversation-button").style.display =
            "none";
    }
}

function showError(message) {
    $("#error").html('<i class="fa fa-times-circle"></i> ' + message);
    $("#error").show();
}

function convertAudioToBinaryMessage(audioChunk) {
    let raw = mic.toRaw(audioChunk);
    if (raw == null) return;

    // downsample and convert the raw audio bytes to PCM
    let downsampledBuffer = audioUtils.downsampleBuffer(
        raw,
        inputSampleRate,
        sampleRate
    );
    let pcmEncodedBuffer = audioUtils.pcmEncode(downsampledBuffer);

    // add the right JSON headers and structure to the message
    let audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

    //convert the JSON object + headers into a binary event stream message
    let binary = eventStreamMarshaller.marshall(audioEventMessage);
    return binary;
}

function getAudioEventMessage(buffer) {
    // wrap the audio data in a JSON envelope
    return {
        headers: {
            ":message-type": {
                type: "string",
                value: "event",
            },
            ":event-type": {
                type: "string",
                value: "AudioEvent",
            },
        },
        body: buffer,
    };
}

function createPresignedUrl() {
    // Validate credentials are available
    if (!AWS.config.credentials || !AWS.config.credentials.accessKeyId) {
        console.error('AWS credentials not available for creating presigned URL');
        return null;
    }
    
    let endpoint = "transcribestreaming." + region + ".amazonaws.com:8443";

    try {
        if (languageCode == "auto") {

            // get a preauthenticated URL that we can use to establish our WebSocket
            return v4.createPresignedURL(
                "GET",
                endpoint,
                "/stream-transcription-websocket",
                "transcribe",
                crypto.createHash("sha256").update("", "utf8").digest("hex"),
                {
                    key: AWS.config.credentials.accessKeyId,
                    secret: AWS.config.credentials.secretAccessKey,
                    sessionToken: AWS.config.credentials.sessionToken,
                    protocol: "wss",
                    expires: 15,
                    region: region,
                    query:
                        "&identify-language=true&language-options=zh-CN,en-US,fr-FR,de-DE,it-IT,ja-JP,ko-KR,pt-BR,es-US" +
                        "&media-encoding=pcm&sample-rate=" +
                        sampleRate,
                }
            );

        } else {

            // get a preauthenticated URL that we can use to establish our WebSocket
            return v4.createPresignedURL(
                "GET",
                endpoint,
                "/stream-transcription-websocket",
                "transcribe",
                crypto.createHash("sha256").update("", "utf8").digest("hex"),
                {
                    key: AWS.config.credentials.accessKeyId,
                    secret: AWS.config.credentials.secretAccessKey,
                    sessionToken: AWS.config.credentials.sessionToken,
                    protocol: "wss",
                    expires: 15,
                    region: region,
                    query:
                        "language-code=" +
                        languageCode +
                        "&media-encoding=pcm&sample-rate=" +
                        sampleRate,
                }
            );
        }
    } catch (error) {
        console.error('Error creating presigned URL:', error);
        return null;
    }
}


/**
 * Click events handling and functions for "Help me see objects", "Help me read labels & signs" and "Help me read documents" features
 */

// Camera controls - only set up if webcam is initialized
function setupCameraControls() {
    $("#cameraFlip").click(function () {
        if (webcam) {
            webcam.flip();
            webcam.start();
        }
    });

    $("#closeError").click(function () {
        $("#webcam-switch").prop("checked", false).change();
    });

    $("#take-photo").click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!webcam) {
            console.error('Webcam not initialized');
            alert('Camera is not ready. Please wait for the camera to initialize.');
            return;
        }
        
        try {
            let picture = webcam.snap();
            if (!picture) {
                console.error('Failed to capture picture');
                alert('Failed to take photo. Please try again.');
                return;
            }
            
            console.log('Photo captured successfully, processing image...');
            document.getElementById("cameraFlip").style.display = "none";
            if (document.getElementById("translateTextTo")) 
                document.getElementById("translateTextTo").selectedIndex = 0; 
            
            // Update queryString before processing
            queryString = window.location.search;
            ProcessImage(picture);
            
            document.getElementById("audioSource").src = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
            document.getElementById("audioPlayback").load();
        } catch (error) {
            console.error('Error taking photo:', error);
            alert('Error taking photo: ' + (error.message || error));
        }
    });
}

// Set up camera controls when jQuery is ready
if (typeof $ !== 'undefined') {
    $(document).ready(function() {
        setupCameraControls();
    });
} else {
    // Wait for jQuery to load
    var checkJQuery = setInterval(function() {
        if (typeof $ !== 'undefined') {
            clearInterval(checkJQuery);
            $(document).ready(function() {
                setupCameraControls();
            });
        }
    }, 100);
}

$("#upload-image").click(function () {
    window.location.href = window.location.href.replace("f-see-document.html","f-see-upload-document.html");
});

function displayError(err = "") {
    if (err != "") {
        $("#errorMsg").html(err);
    }
    $("#errorMsg").removeClass("d-none");
}

function cameraStarted() {
    if (!webcam) {
        console.error('Webcam not initialized in cameraStarted');
        return;
    }
    webcam.flip();
    webcam.start();
    $("#errorMsg").addClass("d-none");
    $(".flash").hide();
    $("#webcam-caption").html("on");
    $("#webcam-control").removeClass("webcam-off");
    $("#webcam-control").addClass("webcam-on");
    $(".webcam-container").removeClass("d-none");
    if (webcam.webcamList && webcam.webcamList.length == 1) {
        $("#cameraFlip").removeClass("d-none");
    }
    $("#wpfront-scroll-top-container").addClass("d-none");
    window.scrollTo(0, 0);
    $("body").css("overflow-y", "hidden");
}

//Loads selected image and unencodes image bytes for Rekognition/Textract API
function ProcessImage(picture) {
    // Update queryString in case it changed
    queryString = window.location.search;
    
    if (!picture) {
        console.error('ProcessImage called with no picture');
        return;
    }

    if (window.location.href.indexOf("f-see-text") != -1) {

        var blob;

        // Load base64 encoded image for display
        var reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {
                //Call Rekognition
                AWS.region = region;
                var rekognition = new AWS.Rekognition();
                var params = {
                    Image: {
                        Bytes: e.target.result,
                    },
                };

                rekognition.detectText(params, function (err, data) {
                    if (err) console.log(err, err.stack);
                    // an error occurred
                    else {
                        var string = "";
                        var stringHTML = "";
                        for (var i = 0; i < data.TextDetections.length; i++) {
                            if (data.TextDetections[i].Type == "LINE") {
                                string += data.TextDetections[i].DetectedText + ", ";
                                stringHTML += data.TextDetections[i].DetectedText + "\r\n";
                                //stringHTML += data.TextDetections[i].DetectedText + " ";
                            }
                        }

                        if (string != "") {
                            string = string.substring(0, string.length - 1);
                            stringHTML = stringHTML.substring(0, stringHTML.length - 1);
                            var urlParams = new URLSearchParams(queryString);
                            var languageFromURL = urlParams.get("language");
                            document.getElementById("show-text").style.display = "block";
                            document.getElementById("detectedText").style.display = "block";
                            document.getElementById("detectedTextAlert").style.display = "none";
                            document.getElementById("detectedText").value = stringHTML;
                            detectedText = stringHTML;
                            document.getElementById("translate-dyslexic-div").style.display = "block";
                            if (languageFromURL == "ar" || languageFromURL == "arb" || languageFromURL == "ar-AE") {
                                $("#detectedText").css("direction", "rtl");
                            } else {
                                $("#detectedText").css("direction", "ltr");
                            }                            
                            speakDetectedTextFromWebcam(string, languageFromURL);
                        } else {
                            document.getElementById("show-text").style.display = "block";
                            document.getElementById("detectedTextAlert").style.display = "block";
                            document.getElementById("translate-dyslexic-div").style.display = "none";
                            document.getElementById("detectedText").style.display = "none";
                            document.getElementById("detectedTextAlert").innerHTML = "No text detected. Please try again!";
                            speakDetectedTextFromWebcam("No text detected. Please try again!", "en-US");
                        }
                    }
                });
            };
        })(blob);

        fetch(picture)
            .then((resp) => resp.blob())
            .then((blob) => reader.readAsArrayBuffer(blob));

    }

    else if (window.location.href.indexOf("f-see-document") != -1) {

        var blob;

        // Load base64 encoded image for display
        var reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {
                //Call Textract
                var textract = new AWS.Textract();
                var params = {
                  Document: { /* required */
                    Bytes: e.target.result,
                  }
                };                

                textract.detectDocumentText(params, function (err, data) {
                    if (err) console.log(err, err.stack);
                    // an error occurred
                    else {
                        var string = "";
                        var stringHTML = "";
                        for (var i = 0; i < data.Blocks.length; i++) {
                            if (data.Blocks[i].BlockType == "LINE") {
                                string += data.Blocks[i].Text + ", ";
                                stringHTML += data.Blocks[i].Text + "\r\n";
                                //stringHTML += data.Blocks[i].Text + " ";
                            }
                        }

                        if (string != "") {
                            string = string.substring(0, string.length - 1);
                            stringHTML = stringHTML.substring(0, stringHTML.length - 1);
                            var urlParams = new URLSearchParams(queryString);
                            var languageFromURL = urlParams.get("language");
                            document.getElementById("show-text").style.display = "block";
                            document.getElementById("detectedText").style.display = "block";
                            document.getElementById("detectedTextAlert").style.display = "none";
                            document.getElementById("detectedText").value = stringHTML;
                            detectedText = stringHTML;
                            document.getElementById("translate-dyslexic-div").style.display = "block";
                            if (languageFromURL == "ar" || languageFromURL == "arb" || languageFromURL == "ar-AE") {
                                $("#detectedText").css("direction", "rtl");
                            } else {
                                $("#detectedText").css("direction", "ltr");
                            }                            
                            speakDetectedTextFromWebcam(string, languageFromURL);
                        } else {
                            document.getElementById("show-text").style.display = "block";
                            document.getElementById("detectedTextAlert").style.display = "block";
                            document.getElementById("translate-dyslexic-div").style.display = "none";
                            document.getElementById("detectedText").style.display = "none";
                            document.getElementById("detectedTextAlert").innerHTML = "No text detected. Please try again!";
                            speakDetectedTextFromWebcam("No text detected. Please try again!", "en-US");
                        }
                    }
                });
            };
        })(blob);

        fetch(picture)
            .then((resp) => resp.blob())
            .then((blob) => reader.readAsArrayBuffer(blob));

    }

    else if (window.location.href.indexOf("f-see-objects") != -1) {

        var blob;
        var labels = [];
        var parents = [];

        // Load base64 encoded image for display
        var reader = new FileReader();

        reader.onload = (function (theFile) {
            return function (e) {
                //Call Rekognition
                AWS.region = region;
                var rekognition = new AWS.Rekognition();
                var params = {
                    Image: {
                        Bytes: e.target.result,
                    },
                    MaxLabels: 10, 
                    MinConfidence: 80
                };

                rekognition.detectLabels(params, function (err, response) {
                    if (err) console.log(err, err.stack);
                    // an error occurred
                    else {
                        response.Labels.forEach(label => {
                            labels.push(label.Name);
                            if (typeof label.Parents !== 'undefined' && label.Parents.length > 0) 
                                label.Parents.forEach(parent => {
                                    parents.push(parent.Name);
                                })
                        })
                        labels = labels.filter( ( el ) => !parents.includes( el ) );
                        if (labels.length > 0) {
                            var string = "I see ";
                            labels.forEach(item => {
                                string += item.toLowerCase() + ", ";
                            }) 
                            string = string.substring(0, string.length - 2);

                            var sanitizedString = document.createElement('div');

                            var urlParams = new URLSearchParams(queryString);
                            var languageFromURL = urlParams.get("language");
                            document.getElementById("show-text").style.display = "block";

                            if (languageFromURL != "en")
                                {
                                    var translate = new AWS.Translate();
                                    var params = {
                                        SourceLanguageCode: "en",
                                        TargetLanguageCode: languageFromURL.substring(0, 2),
                                        Text: string,
                                    };
                                    translate.translateText(params, function (err, data) {
                                        if (err) 
                                            console.log(err, err.stack); 
                                        else {
                                            string = data['TranslatedText'];
                                            sanitizedString.textContent = string;
                                            document.getElementById("detectedText").innerHTML = sanitizedString.innerHTML;
                                            if (languageFromURL == "ar" || languageFromURL == "arb" || languageFromURL == "ar-AE") {
                                                $("#detectedText").css("direction", "rtl");
                                            } else {
                                                $("#detectedText").css("direction", "ltr");
                                            }
                                            speakDetectedTextFromWebcam(string, languageFromURL);
                                        }
                                    });
                                } else {
                                    sanitizedString.textContent = string;
                                    document.getElementById("detectedText").innerHTML = sanitizedString.innerHTML;
                                    $("#detectedText").css("direction", "ltr");
                                    speakDetectedTextFromWebcam(string, languageFromURL);
                                }

                        } else {
                            console.log("No objects detected. Please try again!");
                            document.getElementById("show-text").style.display = "block";
                            document.getElementById("detectedText").innerHTML = "No objects detected. Please try again!";
                            speakDetectedTextFromWebcam("No objects detected. Please try again!", "en-US");
                        }
                    }
                });
            };
        })(blob);

        fetch(picture)
            .then((resp) => resp.blob())
            .then((blob) => reader.readAsArrayBuffer(blob));

    }
}

function speakDetectedTextFromWebcam(detectedText, language) {
    setLanguage();
    var voiceId = pollyVoiceMap.get(language);

    // Create the JSON parameters for getSynthesizeSpeechUrl
    var speechParams = {
        OutputFormat: "mp3",
        Text: "",
        TextType: "text",
        VoiceId: voiceId,
        Engine: "standard"
    };

    if (pollyNeuralVoices.includes(voiceId) && pollyNeuralVoicesRegions.includes(region)) 
        speechParams.Engine = "neural";
    
    if (pollyGenerativeVoices.includes(voiceId) && pollyGenerativeRegions.includes(region)) 
        speechParams.Engine = "generative";

    speechParams.Text = detectedText;

    // Create the Polly service object and presigner object
    var polly = new AWS.Polly({ apiVersion: "2016-06-10" });
    var signer = new AWS.Polly.Presigner(speechParams, polly);

    // Create presigned URL of synthesized speech file
    signer.getSynthesizeSpeechUrl(speechParams, function (error, url) {
        if (error) {
        } else {
            document.getElementById("audioSource").src = url;
            document.getElementById("audioPlayback").load();
        }
    });
}

