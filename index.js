const functions = require('firebase-functions')

const app = require('express')()

const {getAllScreams, postOneScream} = require('./handlers/screams')
const {signup, login} = require('./handlers/users')
const FBAuth	 = require('./util/FBAuth')

//screams route 
app.get('/screams' , getAllScreams)
//post a scream route - its okay to send only body(without sending handle in POST req), as Handle will come 
//from the authorization
app.post('/scream' , FBAuth , postOneScream)

//users routes
app.post('/signup', signup)
app.post("/login" , login)


exports.api = functions.https.onRequest(app)
