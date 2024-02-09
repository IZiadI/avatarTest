import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAqgo2C6IUmsOrDBPvRwoxPv9gerO7PW-4",
    authDomain: "phlex-exercises.firebaseapp.com",
    projectId: "phlex-exercises",
    storageBucket: "phlex-exercises.appspot.com",
    messagingSenderId: "785102649818",
    appId: "1:785102649818:web:c81d2e5bbb116f885d28e3",
    databaseURL: "https://phlex-exercises-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "gs://phlex-exercises.appspot.com",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);


window.uploadFile = (jsonString, exercisePath) => {
    var blob = new Blob([jsonString]);
    var storageRef = ref(storage, 'Exercises/' + exercisePath);
    uploadBytes(storageRef, blob).then((snapshot) => {
        console.log('Uploaded an array!');
    });
}

window.downloadFile = (path) => {
    return new Promise((resolve, reject) => {
        getDownloadURL(ref(storage, 'Exercises/' + path))
            .then((url) => {
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'text';
                xhr.onload = (event) => {
                    var txt = xhr.response;
                    resolve(txt);
                };
                xhr.open('GET', url);
                xhr.send();
            }).catch((error) => {
                reject(error);
            })
    })
}

window.addEventListener("load", function () {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("ServiceWorker.js");
    }
});

var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var loadingBar = document.querySelector("#unity-loading-bar");
var progressBarFull = document.querySelector("#unity-progress-bar-full");
var warningBanner = document.querySelector("#unity-warning");

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg, type) {
    function updateBannerVisibility() {
        warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
    }
    var div = document.createElement('div');
    div.innerHTML = msg;
    warningBanner.appendChild(div);
    if (type == 'error') div.style = 'background: red; padding: 10px;';
    else {
        if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
        setTimeout(function () {
            warningBanner.removeChild(div);
            updateBannerVisibility();
        }, 5000);
    }
    updateBannerVisibility();
}

var buildUrl = "Build";
var loaderUrl = buildUrl + "/phlexAvatar.loader.js";
var config = {
    dataUrl: buildUrl + "/phlexAvatar.data",
    frameworkUrl: buildUrl + "/phlexAvatar.framework.js",
    codeUrl: buildUrl + "/phlexAvatar.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "MVB",
    productName: "Phlex_excerciseConstructor",
    productVersion: "0.1",
    showBanner: unityShowBanner,
};

// By default Unity keeps WebGL canvas render target size matched with
// the DOM size of the canvas element (scaled by window.devicePixelRatio)
// Set this to false if you want to decouple this synchronization from
// happening inside the engine, and you would instead like to size up
// the canvas DOM size and WebGL render target sizes yourself.
// config.matchWebGLToCanvasSize = false;

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    // Mobile device style: fill the whole browser client area with the game canvas:
    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
    document.getElementsByTagName('head')[0].appendChild(meta);
}

loadingBar.style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
    createUnityInstance(canvas, config, (progress) => {
        progressBarFull.style.width = 100 * progress + "%";
    }).then((unityInstance) => {
        window.unityInstance = unityInstance;
        loadingBar.style.display = "none";
    }).catch((message) => {
        alert(message);
    });
};
document.body.appendChild(script);