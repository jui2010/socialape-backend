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


//triggers
// create notifications , for when someone likes a scream
exports.createNotificationOnLike = functions.firestore.document('/likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                //if a user likes his own scream we do not give the user a notification
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
            .catch(err =>{
                console.log(err)
            })
    })

// create notifications , for when someone comments on a scream
exports.createNotificationOnComment = functions.firestore.document('/comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
        .catch(err =>{
            return
        })
    })

// delete notifications , for when someone likes a scream  and then unlikes it
exports.deleteNotificationOnUnlike = functions.firestore.document('/likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err =>{
                return
            })
    })


//trigger to change all the pics in places where user comments/likes, if that user updates his profile picture
exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate(change => {
        console.log(change.before.data())
        console.log(change.after.data())
        //check if the user infact has changed his profile image
        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            let batch = db.batch()
            return db.collection('screams').where('userHandle', '==', change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`)
                        batch.update(scream , {userImage : change.after.data().imageUrl})
                    })
                    return batch.commit()
                })
        }else {
            return true
        }
        
    })

exports.onScreamDelete = functions.firestore.document('/screams/{screamId}')
    .onDelete((snapshot , context) => {
        const screamId = context.params.screamId
        const batch = db.batch()

        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`))
                })
                return db.collection('likes').where('screadId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`))
                })
                return db.collection('notifications').where('screadId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`))
                })
                return batch.commit()
            })
            .catch(err => {
                return 
            })
    })