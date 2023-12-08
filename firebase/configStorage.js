const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

const serviceAccount = require('./creds.json');

const adminApp = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'capstoneproject-ch2ps217.appspot.com'
});

const bucket = getStorage(adminApp).bucket();

module.exports = {bucket};