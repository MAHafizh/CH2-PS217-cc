const firebase = require("firebase");

const firebaseConfig = {
  apiKey: "AIzaSyCW3442EEdErwd6lbvMtsaDRCwowl_BQlo",
  authDomain: "capstoneproject-ch2ps217.firebaseapp.com",
  projectId: "capstoneproject-ch2ps217",
  storageBucket: "capstoneproject-ch2ps217.appspot.com",
  messagingSenderId: "362005280277",
  appId: "1:362005280277:web:c5211a6adf924f9bc2c01c"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const userRefs = db.collection("useraccount");
const fieldvalue = firebase.firestore.FieldValue;

module.exports = {userRefs, fieldvalue};