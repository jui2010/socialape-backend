

const firebaseConfig  = {
    apiKey: "AIzaSyAfwJcKPAd7CORN_fPR6MhmNhYpEYWtV2g",
    authDomain: "socialape-74e0b.firebaseapp.com",
    databaseURL: "https://socialape-74e0b.firebaseio.com",
    projectId: "socialape-74e0b",
    storageBucket: "socialape-74e0b.appspot.com",
    messagingSenderId: "443081746728",
    appId: "1:443081746728:web:53b6c40ce80e3e7e53081d",
    measurementId: "G-P69N4ZCSHL"
};

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)

module.exports = {firebase, firebaseConfig}

