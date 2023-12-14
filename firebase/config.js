const admin = require("firebase-admin");
const credential = require("./creds.json");

admin.initializeApp({
    credential: admin.credential.cert(credential),
});

module.exports = admin;
