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
app.get('/screams', (req,res)=>{
    db
    .collection('screams')
    .orderBy('createdAt','desc')
    .get()
    .then((data)=>{
        let screams =[];
        data.forEach((doc)=> {
        screams.push(
            {screamId: doc.id,
             ...doc.data() 
            }
        );
    });
       return res.json(screams); 
    }).catch(err => console.log(err));
})
 
// Third API function:
  app.post('/scream',(req, res) => {

        const newScream = {
            body: req.body.body,
            userHandle: req.body.userHandle,
            createdAt: new Date().toISOString()
        };

        db
        .collection('screams')
        .add(newScream)
        .then((doc)=>{
            res.json({message: ` The ${doc.id} was created successfully`});
        })
        .catch((err)=>{
            res.status(500).json({error: ` Someting went wrong`});
            console.error(err);
        });   
   });

//Signup route
app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    //TODO: validate data
    db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc=>{
        if(doc.exists){
            return res.status(400).json({handle: `This handle is already taken`});
        }
        else{
           
            return  firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then((data)=>{
        return  data.user.getIdToken();
    })
    .then((token) =>{
        return res.status(201).json({ token });
    })
    .catch((err) =>{
        console.error(err);
        res.status(500).json({error: err.code});
    });
});

   exports.api=functions.https.onRequest(app);