const functions = require('firebase-functions')
const {db} = require('./util/admin')
const app = require('express')()

const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require('./handlers/screams')
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users')
const FBAuth = require('./util/FBAuth')

//screams route 
app.get('/screams' , getAllScreams)
//post a scream route - its okay to send only body(without sending handle in POST req), as Handle will come 
//from the authorization
app.post('/scream' , FBAuth , postOneScream)
app.get('/scream/:screamId' , getScream)
app.post('/scream/:screamId/comment' , FBAuth, commentOnScream)
app.post('/scream/:screamId/like' , FBAuth, likeScream)
app.post('/scream/:screamId/unlike' , FBAuth, unlikeScream)
app.delete('/scream/:screamId/' , FBAuth, deleteScream)

//users routes
app.post('/signup', signup)
app.post('/login' , login)
app.post('/user/image',FBAuth, uploadImage)
app.post('/user',FBAuth, addUserDetails)
app.get('/user',FBAuth, getAuthenticatedUser)
app.get('/user/:handle', getUserDetails)
app.post('/notifications',FBAuth, markNotificationsRead)


exports.api = functions.https.onRequest(app)

// create notifications , for when someone likes a scream
exports.createNotificationOnLike = functions.firestore.document('/likes/{id}')
    .onCreate((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt : new Date().toISOString(),
                    recipient : doc.data().userHandle,
                    sender : snapshot.data().userHandle,
                    type : 'like',
                    read : false,
                    screamId : doc.id
                })
            }
        })
        .then(() => {
            return
        })
        .catch(err =>{
            return
        })
    })

// create notifications , for when someone comments on a scream
exports.createNotificationOnComment= functions.firestore.document('/comments/{id}')
    .onCreate((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`).get()
        .then(doc => {
            if(doc.exists){
                return db.doc(`/notifications/${snapshot.id}`).set({
                    createdAt : new Date().toISOString(),
                    recipient : doc.data().userHandle,
                    sender : snapshot.data().userHandle,
                    type : 'comment',
                    read : false,
                    screamId : doc.id
                })
            }
        })
        .then(() => {
            return
        })
        .catch(err =>{
            return
        })
    })

// delete notifications , for when someone likes a scream  and then unlikes it
exports.deleteNotificationOnUnlike = functions.firestore.document('/likes/{id}')
    .onDelete((snapshot) => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(() => {
                return
            })
            .catch(err =>{
                return
            })
    })