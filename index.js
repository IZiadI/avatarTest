import '/styles.css';

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";

import { 
    getAuth,
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword,
} from 'firebase/auth';
  

import { 
  showApp, 
} from './ui'

// Get the query string from the current URL
var queryString = window.location.search;

// Now you can use the parseQueryString function from the previous example to parse the query string into a dictionary
var params = parseQueryString(queryString);

window.isAppReady = false;
window.isExercisePending = false;

var exerciseCopied = false;

var exerciseData = {
    animation: null,
    image: [0,0],
    mediapipeData: null,
}

const firebaseConfig = {
    apiKey: "*********",
    authDomain: "*********",
    projectId: "*********",
    storageBucket: "*********",
    messagingSenderId: "*********",
    appId: "*********", 
    measurementId: "*********" 
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const exercisePathText = document.getElementById("pathText");

function updateDocRef()
{
    docRef = doc(firestore, document.getElementById("firestoreDocPath").innerHTML);
}

async function getExercisePathFromFirestoreDoc()
{
    var docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        var animationPath = docSnap.data()["animation"];
        if (animationPath) {
            animationPath = animationPath.substring(animationPath.indexOf('Exercises/') + 10);
            return animationPath;
        }
        else
        {
            return null;
        }
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
        await setDoc(docRef, {
            
        });
        return null;
    }
}

window.onLoadAnimationButtonClick = () => {
    if (window.isAppReady)
    {
        loadAnimation();
    }
    else
    {
        isExercisePending = true;
    }
}

window.loadAnimationFromFirestoreDoc = () => {
    updateDocRef();
    getExercisePathFromFirestoreDoc().then((path) => {
        if (path == null)
            return;
        exercisePathText.innerHTML = path;
        window.onLoadAnimationButtonClick();
    });
}

function parseQueryString(queryString) {
    var params = {};
    var queryStringWithoutQuestionMark = queryString.substring(1); // Remove the leading '?'
    var keyValuePairs = queryStringWithoutQuestionMark.split('&'); // Split the query string into key-value pairs

    keyValuePairs.forEach(function(keyValuePair) {
        var pair = keyValuePair.split('='); // Split each key-value pair
        var key = decodeURIComponent(pair[0]); // Decode the key
        var value = decodeURIComponent(pair[1] || ''); // Decode the value (if it exists)

        if (key.length) {
            if (params[key]) {
                if (Array.isArray(params[key])) {
                    params[key].push(value);
                } else {
                    params[key] = [params[key], value];
                }
            } else {
                params[key] = value; // Store the key-value pair in the params object
            }
        }
    });

    return params;
}

window.updateFireStoreDoc = (exerciseData) => {
    if (!params["firestoreDoc"])
        return;
    var newExercisePath = doc(firestore, params["firestoreDoc"]);
    const docData = {
        animation: exercisePath,
    };
    updateDoc(newExercisePath, docData);
}

function updateFirestoreData()
{
    updateDoc(docRef, exerciseData);
    exerciseData = {
        animation: null,
        image: [0,0],
        mediapipeData: null,
    }
    exerciseCopied = false;
}

async function copyFireStoreDoc(newPath)
{
    var docSnap = await getDoc(docRef);
    const newDocRef = doc(firestore, newPath);

    if (docSnap.exists()) {
        await setDoc(newDocRef, docSnap.data());
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
    }

    docRef = newDocRef;

    exerciseCopied = true;
}

window.uploadFile = (jsonString, exercisePath, fileName) => {
    return new Promise((resolve, reject) => {
        var blob;
        if (fileName.endsWith(".jpg"))
        {
            const byteCharacters = atob(jsonString);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: 'image/jpeg' });
        }
        else
        {
            blob = new Blob([jsonString]);
        }
        var directory;
        if (params["uid"])
        {
            directory = 'Exercises/userExercises/' + params["uid"] + '/';
            if (!exerciseCopied) {
                updateDocRef();
                copyFireStoreDoc("Doctors/" + params["uid"] + "/Edited Exercises/" + exercisePath);
            }
        }
        else
        {
            directory = 'Exercises/authenticatedExercises/';
            updateDocRef();
        }
        var storageRef = ref(storage, directory + exercisePath + '/' + fileName);
        uploadBytes(storageRef, blob).then((snapshot) => {
            if (fileName == "AnimationData")
            {
                exerciseData.animation = directory + exercisePath + "/" + fileName;
            }
            else if (fileName == "MediaPipeData")
            {
                exerciseData.mediapipeData = directory + exercisePath + "/" + fileName;
            }
            else if (fileName.endsWith(".jpg"))
            {
                getDownloadURL(ref(storage, directory + exercisePath + "/" + fileName)).then((url) => {
                    if (fileName == "male.jpg")
                    {
                        exerciseData.image[0] = url;
                    }
                    else
                    {
                        exerciseData.image[1] = url;
                    }
                    if (exerciseData.animation != null && exerciseData.mediapipeData != null && exerciseData.image[0] != 0 && exerciseData.image[1] != 0) {
                        
                        console.log("uploading Data");
                        updateFirestoreData();
                    }
                })
            }        
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


window.loadAnimation = () => {
    console.log("loading Animation");
    window.downloadFile(exercisePathText.innerHTML).then((animationData) => {
        window.unityInstance.SendMessage("fireBaseManager", "quickLoadAnimation", animationData);
    })
}

var docRef;
if (params["firestoreDoc"]) {
    console.log("getting exercise");
    document.getElementById("firestoreDocPath").innerHTML = params["firestoreDoc"];
    updateDocRef();
    window.loadAnimationFromFirestoreDoc();
}

window.pushJsonToFireStoreDoc = (jsonString) =>
{
    var jsonData = JSON.parse(jsonString);
    updateDoc(docRef,jsonData);
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
                loadUnityInstance();
                showApp();
            }
            else {
                loadUnityInstance();
                showApp();
          }
    })
  }
  
  // Log out
  const logout = async () => {
    await signOut(auth);
  }
  
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
