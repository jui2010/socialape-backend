const functions = require('firebase-functions')

const app = require('express')()

const {getAllScreams, postOneScream} = require('./handlers/screams')
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users')
const FBAuth = require('./util/FBAuth')

//screams route 
app.get('/screams' , getAllScreams)
//post a scream route - its okay to send only body(without sending handle in POST req), as Handle will come 
//from the authorization
app.post('/scream' , FBAuth , postOneScream)

//users routes
app.post('/signup', signup)
app.post('/login' , login)
app.post('/user/image',FBAuth, uploadImage)
app.post('/user',FBAuth, addUserDetails)
app.get('/user',FBAuth, getAuthenticatedUser)

exports.api = functions.https.onRequest(app)
