const {admin, db} = require('../util/admin')
const {firebase, firebaseConfig} = require('../util/config')


const {validateSignupData,validateLoginData, reduceUserDetails}  = require('../util/validators')
//validate the email, passwd, handle

exports.signup = (req, res) => {
    const newUser = {
        email : req.body.email,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        handle : req.body.handle
    }

    let {errors , valid } = validateSignupData(newUser)
    if(!valid){
        return res.status(400).json(errors)
    }

    const noImg = 'no-profile-image.png' 


    //TODO validate user
    let token, userId
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({handle : `This handle already exists`})
        }else{
            return firebase.auth().createUserWithEmailAndPassword(newUser.email , newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid
        return data.user.getIdToken()
    })
    .then((idToken) => {
        token = idToken
        const userCredentials = {
            handle : newUser.handle,
            email : newUser.email,
            password : newUser.password,
            createdAt : new Date().toISOString(),
            imageUrl : `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
            userId
        }
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    }) 
    .then(() => {
        return res.status(201).json({token})
    })
    .catch(err => {
        console.log(err)
        if(err.code === 'auth/email-already-in-use'){
            return res.status(400),json({email : 'Email already in use'})
        }else{
            return res.status(500).json({general : 'Something went wrong'})
        }
    })
}

//login user
exports.login = (req, res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    }

    let {errors, valid } = validateLoginData(user)
    if(!valid){
        return res.status(400).json(errors)
    }


    // if no errors exist, login the user to firebase
    firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
        return data.user.getIdToken()
    })
    .then((token) => {
        return res.json({token})
    })
    .catch((err) => {
        console.log(err)
        return res.status(403).json({general : "Wrong password, try again"})        
    })
}


//Add and get user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body)

    db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.json({ message : 'Details added successfully'})
    })
    .catch((err) => {
        console.error( err)
        return res.status(500).json({ error : err.code})
    })
}

//Get any users details - (not a protected route)
exports.getUserDetails = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.params.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.user = doc.data()
            return db.collection('screams').where('userHandle', '==', req.params.handle)
                .orderBy('createdAt', 'desc')
                .get()
        }else{
            return res.status(404).json({error : err.code })
        }
    })
    .then(data => {
        userData.screams = []
        data.forEach(doc => {
            userData.screams.push({
                body : doc.data().body,
                createdAt : doc.data().createdAt,
                userHandle : doc.data().userHandle,
                userImage : doc.data().userImage,
                likeCount : doc.data().likeCount,
                commentCount : doc.data().commentCount,
                screamId : doc.id
            })
        })
        return res.json(userData)
    })
    .catch(err => {
        return res.status(500).json({error : err.code})
    })
}


// Get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {}
    db
    .doc(`/users/${req.user.handle}`)
    .get()
    .then(doc => {
        if(doc.exists){
            userData.credentials = doc.data()
            return db.collection('likes').where('userHandle', '==', req.user.handle).get()
        }
    })
    .then(data => {
        userData.likes = []
        data.forEach((doc) => {
            userData.likes.push(doc.data())
        })
        return db.collection('notifications').where('recipient', '==', req.user.handle)
            .orderBy('createdAt', 'desc').limit(10).get()
    })
    .then(data => {
        userData.notifications = []
        data.forEach(doc => {
            userData.notifications.push({
                recipient : doc.data.recipient,
                sender : doc.data().sender,
                createdAt : doc.data().createdAt,
                screamId : doc.data().screamId,
                type : doc.data().type,
                read : doc.data().read,
                notificationId : doc.id
            })   
        })
        return res.json(userData)
    })
    .catch(err => {
        console.error(err)
        return res.status(500).json({ error : err.code})
    })
}

//upload image as profile photo, and add default pic for each new user created
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy') //to upload images
    const path = require('path')
    const os = require('os')
    const fs = require('fs') //filesystem

    const busboy = new BusBoy({headers : req.headers})

    let imageFileName
    let imageToBeUploaded = {}

    busboy.on('file' , (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
            return res.status(400).json({ error : 'Wrong file type submitted'})
        } 
        
        const imageExtension = filename.split('.')[filename.split('.').length - 1]
        imageFileName = `img.${imageExtension}`
        const filepath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = {filepath, mimetype}
        file.pipe(fs.createWriteStream(filepath))
    })

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable : false,
            metadata : {
                metadata : {
                    contentType : imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`users/${req.user.handle}`).update({imageUrl : imageUrl})
        })
        .then(() => {
            return res.json({message: "Image uploaded successfully"})
        })
        .catch(err => {
            console.log(err)
            return res.status(500).json({error : err.code})
        })
    })

    busboy.end(req.rawBody)
}

//if user opens a notif, then mark it as read
exports.markNotificationsRead = (req, res) => {
    let batch = db.batch()

    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`)
        batch.update(notification, {read : true})
    })
    batch.commit()
        .then(() => {
            return res.json({ message : 'Notifications marked read'})
        })
        .catch(err => {
            return res.status(500).json({ error : err.code})
        })
}