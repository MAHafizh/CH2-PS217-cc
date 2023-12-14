const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const secretKey = 'keytoken0!'
app.use(bodyParser.json());

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token.split(' ')[1], secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = user;
      next();
    });
};

const userAuth = async (req, res, next) => {
    const token = req.headers.auth

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    }catch(error){
        return res.status(401).json({
            status: {
                code: 401,
                message: "Unauthorized"
            }
        });
    }
}

app.use(userAuth);

app.post("/token", (req, res)=>{
    const {email, password} = req.body;

    if(email === 'email' && password === 'pass' ){

        const token = jwt.sign({username}, secretKey, {expiresIn: '1h'});

        res.status(200).json({
            status: {
                code: 200,
                message: 'Success'
            },
            data: {
                access_token: token,
                token_type: 'Bearer',
                expiresIn: 3600
            }
        });

    } else {

        res.status(401).json({
            error: 'Unathorized'
        });
    }
});

app.get("/getaccount", authenticateToken, (req, res)=> {
    const userRes = req.user;

    res.status(200).json({
        status: {
            code: 200,
            message: "User Information Retrieved"
        },
        data: userRes
    })
});

app.post('/signup', async (req, res)=>{

    const user = {
        email: req.body.email,
        password: req.body.password
    }
    
    if(!isPasswordValid(user.password)){
        return res.status(400).json({
            status: {
                code: 400,
                message: "Invalid password. It must be at least 8 characters long, contain at least one uppercase letter, and one special character."
            }
        })
    }

    try {
        const userRef = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            emailVerified: false,
            disabled: false
        });
        res.status(200).json({
            status:{
                code: 200,
                message: "Signup Success"
            },
            data: userRef
        });
    }catch(error){
        return res.status(500).json({
            status: {
                code: 500,
                message: error.message
            }
        });
    }
});

app.post('/changepassword', async (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.newPassword;

    try {
        const userRef = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRef.uid, {
            password: newPassword
        });
        res.status(200).json({
            status: {
                code: 200,
                message: "Password changed successfully"
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