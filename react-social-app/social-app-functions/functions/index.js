const functions = require('firebase-functions');
const admin = require('firebase-admin');

const app = require('express')();

// there only one app to deply, check .frebaserc
admin.initializeApp();

const config = {
    apiKey: "AIzaSyBVtrApYCsUoV-B_NXz5W0qIWgH9B2RlXY",
    authDomain: "react-social-app-e3b9e.firebaseapp.com",
    databaseURL: "https://react-social-app-e3b9e.firebaseio.com",
    projectId: "react-social-app-e3b9e",
    storageBucket: "react-social-app-e3b9e.appspot.com",
    messagingSenderId: "716185493921",
    appId: "1:716185493921:web:3dcbf8f47e0f0685"
};

const firebase = require('firebase');
firebase.initializeApp(config);

const db = admin.firestore();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// First API function
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello Said!");
});


// Second API
app.get('/screams', (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(screams);
        }).catch(err => console.log(err));
})

// Third API function:
app.post('/scream', (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({
                message: ` The ${doc.id} was created successfully`
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: ` Someting went wrong`
            });
            console.error(err);
        });
});

const isEmpty = (string) => {
    if (string.trim() === '')
        return true;
    else
        return false;
}

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    else return false;
};


//Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {};

    if (isEmpty(newUser.email)) {
        errors.email = 'Must not be empty';
    } else if(!isEmail(newUser.email)){
        errors.email= 'Must be a valid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not be Empty';
    if(newUser.password!== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if(isEmpty(newUser.handle)) errors.handle= 'Must not be Empty';
    if(Object.keys(errors).length>0) return res.status(400).json(errors);

    
    let token, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({
                    handle: `This handle is already taken`
                });
            } else {

                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            //   return res.status(201).json({ token });
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId: userId
            }
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({
                token
            });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({
                    email: 'Email already in use'
                })
            } else {
                res.status(500).json({
                    error: err.code
                });
            }
        });
});

//Add the login function
app.post('/login', (req, res) => {
    const user = {
      email: req.body.email,
      password: req.body.password
    };
    let errors = {};
    if (isEmpty(user.email)) errors.email = 'Must not be empty';
    if (isEmpty(user.password)) errors.password = 'Must not be empty';
    if (Object.keys(errors).length > 0) return res.status(400).json(errors);
    firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({ token });
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 'auth/wrong-password' | err.code =='auth/user-not-found') {
          return res
            .status(403)
            .json({ general: 'Wrong credentials, please try again' });
        } else return res.status(500).json({ error: err.code });
      });
  });

exports.api = functions.https.onRequest(app);