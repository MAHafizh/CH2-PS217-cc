const admin = require("firebase-admin");
const {getStorage} = require("firebase-admin/storage")
const credential = require("../firebase/creds.json");

const adminApp = admin.initializeApp({
    credential: admin.credential.cert(credential),
    storageBucket: 'capstoneproject-ch2ps217.appspot.com'
});

const bucket = getStorage(adminApp).bucket();

const express = require("express");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const app = express()
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "images";
    
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
    
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },    
});

const fileFilter = function (req, file, cb) {
    if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpeg" ||
        file.mimetype == "image/jpg"
      ) {
        cb(null, true);
      } else {
        req.errorMessage = "File is not a valid image!";
        cb(null, false);
    }
};

const upload = multer({storage, fileFilter});

const isPasswordValid = (password) => {
    if(password.length < 8){
        return false;
    }
    if(!/[A-Z]/.test(password)){
        return false;
    }
    if(!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)){
        return false;
    }

    return true;
};

const deleteStorageFolder = async (uid) => {

    const folderPath = `userimages/${uid}/`; 

    try {
        await bucket.deleteFiles({
            prefix: folderPath
        });
    } catch (error) {
        console.error('Error deleting storage folder:', error);
        throw error;
    }
};

app.post('/profileimage/:uid', upload.single('image'), async (req, res) => {
    try {
        const uid = req.params.uid;
        
        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
              },
              error: "Missing 'id' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if(!userExists) {
            return res.status(404).json({
                status:{
                    code: 404,
                    message: "User Not Found"
                }
            })
        }

        file = req.file;

        const timeISO = new Date().toISOString();
        const timestamp = moment.tz(timeISO, 'Asia/Jakarta');
        const formattedTime = timestamp.format("YYYY-MM-DD_hh:mm:ss");
        const fileName = `userimages/${uid}/profileimage/profileImage_${formattedTime}`
        const uploadOpt = {
            destination: fileName,
            metadata: {
                contentType: file.mimetype,
                metadata:{
                    category: "profilePicture"
                }
            }
        };

        await bucket.deleteFiles({
            prefix: `userimages/${uid}/profileimage`
        });

        await bucket.upload(file.path, uploadOpt);
        
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        fs.unlinkSync(file.path);

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Uploaded The Image'
            },
            data: {
                imageUrl: imageUrl
            }
        });
    } catch(error) {
        res.status(500).json({
            status: {
                code: 500,
                message: 'Internal Server Error'
            },
            data: {
                error: error.message
            }
        })
    }
});

app.get('/profileimage/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        
        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
              },
              error: "Missing 'id' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if(!userExists) {
            return res.status(404).json({
                status:{
                    code: 404,
                    message: "User Not Found"
                }
            })
        }

        const folderPath = `userimages/${uid}/profileimage/`;
        const [files] = await bucket.getFiles({
        prefix: folderPath,
        });

        if (files.length === 0) {
            return res.status(404).json({
              status: {
                code: 404,
                message: "Profile Image Not Found",
              },
            });
          }

        const latestFile = files.reduce((latest, current) => {
            const lastModifiedLatest = new Date(latest.metadata.timeCreated);
            const lastModifiedCurrent = new Date(current.metadata.timeCreated);
            return lastModifiedLatest > lastModifiedCurrent ? latest : current;
        });

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${latestFile.name}`;

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Retrieved the Image'
            },
            data: {
                imageUrl: imageUrl
            }
        });
    } catch(error) {
        res.status(500).json({
            status: {
                code: 500,
                message: 'Internal Server Error'
            },
            data: {
                error: error.message
            }
        })
    }
});

app.post('/images/:uid/:category', upload.single('image'), async (req, res) => {
    try {
        const uid = req.params.uid
        const category = req.params.category
        
        if (!uid || !category) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
              },
              error: "Missing 'id' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if(!userExists) {
            return res.status(404).json({
                status:{
                    code: 404,
                    message: "User Not Found"
                }
            })
        }

        file = req.file;

        const timeISO = new Date().toISOString();
        const timestamp = moment.tz(timeISO, 'Asia/Jakarta');
        const formattedTime = timestamp.format("YYYY-MM-DD_hh:mm:ss");
        const fileName = `userimages/${uid}/clothes/${category}_${formattedTime}`
        const uploadOpt = {
            destination: fileName,
            metadata: {
              contentType: file.mimetype,
              metadata:{
                category,
              }
            }
        };
          
        await bucket.upload(file.path, uploadOpt );

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        fs.unlinkSync(file.path);

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Uploaded The Image'
            },
            data: {
                imageUrl: imageUrl,
                category: category
            }
        });
    } catch(error) {
        res.status(500).json({
            status: {
                code: 500,
                message: 'Internal Server Error'
            },
            data: {
                error: error.message
            }
        })
    }
});

app.get('/images/:uid', async (req, res) => {
    try {
        const uid = req.params.uid
        const category = req.query.category || req.params.category

        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
                },
              error: "Missing 'uid' or 'category' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if (!userExists) {
        return res.status(404).json({
            status: {
                code: 404,
                message: "User Not Found"
                }   
            });
        }

        const [files] = await bucket.getFiles({ prefix: `userimages/${uid}/clothes` });

        const getImages = await Promise.all(files.map(async (file) => {
            const objectRef = admin.storage().bucket(file.bucket.name).file(file.name);
            const [metadata] = await objectRef.getMetadata();
            const resultCategory = metadata && metadata.metadata && metadata.metadata.category;
            return {
                name: file.name,
                url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
                category: resultCategory || 'Uncategorized'
            };
        }));

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Retrieved The Images' 
            },
            images: getImages
        });

    } catch (error) {
        res.status(500).json({
            status: {
              code: 500,
              message: 'Internal Server Error'
            },
            data: {
              error: error.message
            }
          });
    }
});

app.get('/images/:uid/:category', async (req, res) => {
    try {
        const uid = req.params.uid
        const category = req.params.category

        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
                },
              error: "Missing 'uid' or 'category' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if (!userExists) {
        return res.status(404).json({
            status: {
                code: 404,
                message: "User Not Found"
                }   
            });
        }

        const [files] = await bucket.getFiles({ prefix: `userimages/${uid}/clothes` });

        const getImages = files
            .filter((file) => {
                const fileNameParts = file.name.split('/');
                const fileName = fileNameParts[fileNameParts.length - 1];
                const [fileCategory] = fileName.split('_');
    
                return fileCategory === category;
            })
            .map((file) => {
                return {
                    name: file.name,
                    url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
                    category: category || 'Uncategorized',
                };
            });
    
            if(getImages.length === 0){
                return res.status(404).json({
                    status:{
                        code: 404,
                        message: 'No Images Found with Specified Category'
                    }
                });
            }

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Retrieved The Images' 
            },
            images: getImages
        });

    } catch (error) {
        res.status(500).json({
            status: {
              code: 500,
              message: 'Internal Server Error'
            },
            data: {
              error: error.message
            }
          });
    }
});

app.post('/outfit/:uid', upload.single('image'), async (req, res) => {
    try {
        const uid = req.params.uid;
        
        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
              },
              error: "Missing 'id' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if(!userExists) {
            return res.status(404).json({
                status:{
                    code: 404,
                    message: "User Not Found"
                }
            })
        }

        file = req.file;

        const timeISO = new Date().toISOString();
        const timestamp = moment.tz(timeISO, 'Asia/Jakarta');
        const formattedTime = timestamp.format("YYYY-MM-DD_hh:mm:ss");
        const numberOutfit = (await folderCount(`userimages/${uid}/outfit/`)) + 1;
        const fileName = `userimages/${uid}/outfit/${numberOutfit}_myoutfit_${formattedTime}`;
        const uploadOpt = {
            destination: fileName,
            metadata: {
                contentType: file.mimetype,
                metadata:{
                    category: "outfit"
                }
            }
        };

        await bucket.upload(file.path, uploadOpt);

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        fs.unlinkSync(file.path);

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Uploaded The Image'
            },
            data: {
                imageUrl: imageUrl
            }
        });
    } catch(error) {
        res.status(500).json({
            status: {
                code: 500,
                message: 'Internal Server Error'
            },
            data: {
                error: error.message
            }
        })
    }
});

app.get('/outfit/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        
        if (!uid) {
            return res.status(400).json({
              status: {
                code: 400,
                message: "Bad Request",
              },
              error: "Missing 'id' parameter.",
            });
        }

        const userExists = await checkUserExists(uid);

        if(!userExists) {
            return res.status(404).json({
                status:{
                    code: 404,
                    message: "User Not Found"
                }
            })
        }

        const folderPath = `userimages/${uid}/outfit/`;
        const [files] = await bucket.getFiles({
        prefix: folderPath,
        });

        if (files.length === 0) {
            return res.status(404).json({
              status: {
                code: 404,
                message: "Image Not Found",
              },
            });
          }

        const getImages = await Promise.all(files.map(async (file) => {
            const objectRef = admin.storage().bucket(file.bucket.name).file(file.name);
            const [metadata] = await objectRef.getMetadata();
            const resultCategory = metadata && metadata.metadata && metadata.metadata.category;
            const createdTime = metadata && metadata.timeCreated;
            const timestamp = moment.tz(createdTime, 'Asia/Jakarta');
            const formattedTime = timestamp.format("YYYY-MM-DD hh:mm:ss");

            return {
                name: file.name,
                url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
                category: resultCategory || 'Uncategorized',
                created: formattedTime
            };
        }));

        getImages.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));

        res.status(200).json({
            status: {
                code: 200,
                message: 'Successfully Retrieved The Images' 
            },
            imageUrl: getImages
        });
    } catch(error) {
        res.status(500).json({
            status: {
                code: 500,
                message: 'Internal Server Error'
            },
            data: {
                error: error.message
            }
        })
    }
});

app.delete('/deleteaccount/:email', async (req, res) => {
    const email = req.params.email;

    try {
        const userRef = await admin.auth().getUserByEmail(email);
        await deleteStorageFolder(userRef.uid)
        await admin.auth().deleteUser(userRef.uid);

        res.status(200).json({
            status: {
                code: 200,
                message: `Successfully Deleted The Account`
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: {
                code: 500,
                message: error.message
            }
        });
    }
});

async function checkUserExists(uid) {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return userRecord != null;
    } catch (error) {
        return false;
    }
}

async function folderCount(folderPath) {
    try {
      const [files] = await bucket.getFiles({
        prefix: folderPath,
      });
  
      if (files.length === 0) {
        return 0;
      }

      return files.length;

    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      throw error;
    }
}

app.listen(port, ()=> {
    console.log(`server is running on http://localhost:${port}`);
})