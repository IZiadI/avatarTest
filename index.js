import './styles.css';

import { initializeApp } from 'firebase/app';

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";

import { 
    getAuth,
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
  

import { 
  hideLoginError, 
  showLoginState, 
  showLoginForm, 
  showApp, 
  showLoginError, 
  btnLogin,
} from './ui'

const firebaseConfig = {
    apiKey: "AIzaSyDWvuxuXutLo1FJuTEvxc5earHo2T20dFs",
    authDomain: "phlex-d0508.firebaseapp.com",
    projectId: "phlex-d0508",
    storageBucket: "phlex-d0508.appspot.com",
    messagingSenderId: "310184582416",
    appId: "1:310184582416:web:a32a52988ba2874e46d995", 
    measurementId: "G-H5VLZFY9E2"  
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

window.uploadFile = (jsonString, exercisePath) => {
    return new Promise((resolve, reject) => {
        var blob = new Blob([jsonString]);
        var storageRef = ref(storage, 'Exercises/' + exercisePath);
        uploadBytes(storageRef, blob).then((snapshot) => {
            resolve("Uploaded exercise");
        }).catch((error) => {
            reject("Upload failed");
        })
    })
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

////////////////////////////////////AUTH Start//////////////////////////////////////////
const loginEmailPassword = async () => {
    const loginEmail = txtEmail.value
    const loginPassword = txtPassword.value
  
    // // step 1: try doing this w/o error handling, and then add try/catch
    // await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
  
    // step 2: add error handling
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    }
    catch(error) {
      console.log(`There was an error: ${error}`)
      showLoginError(error)
    }
  }
  // Monitor auth state
  const monitorAuthState = async () => {
    onAuthStateChanged(auth, user => {
      if (user) {
          console.log(user);
          loadUnityInstance();
          showApp();
          showLoginState(user);
  
          hideLoginError();
          hideLinkError();
      }
      else {
          showLoginForm();
      }
    })
  }
  
  // Log out
  const logout = async () => {
    await signOut(auth);
  }
  
btnLogin.addEventListener("click", loginEmailPassword) 

monitorAuthState();
  
////////////////////////////////////AUTH END//////////////////////////////////////////

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

function loadUnityInstance() {
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
}
