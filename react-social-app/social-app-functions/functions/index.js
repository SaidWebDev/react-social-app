const functions = require('firebase-functions');
const admin = require('firebase-admin');

// there only one app to deply, check .frebaserc
admin.initializeApp();

const express = require('express');
const app = express();


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

// First API function
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello Said!");
});


// Second API
app.get('/screams', (req,res)=>{
    admin
    .firestore()
    .collection('screams')
    .get()
    .then((data)=>{
        let screams =[];
        data.forEach((doc)=> {
        screams.push(doc.data());
    });
       return res.json(screams); 
    }).catch(err => console.log(err));
})
 
// Third API function:
  app.post('/scream',(req, res) => {

        const newScream = {
            body: req.body.body,
            userHandle: req.body.userHandle,
            createdAt: admin.firestore.Timestamp.fromDate(new Date())
        };

        admin
        .firestore()
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

   exports.api=functions.https.onRequest(app);