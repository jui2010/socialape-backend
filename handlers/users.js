const {db} = require('../util/admin')
const {firebase} = require('../util/config')


//const {validateSignupData,validateLoginData}  = require('../util/validators')
//validate the email, passwd, handle
const isEmail = (email) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if(email.match(regex)){
        return true
    }else{
        return false
    }
}
const isEmpty = (string) => {
    if(string.trim() === ''){
        return true
    }else{
        return false
    }
}

exports.signup = (req, res) => {
    const newUser = {
        email : req.body.email,
        password : req.body.password,
        confirmPassword : req.body.confirmPassword,
        handle : req.body.handle
    }

    let errors ={}

    if(isEmpty(newUser.email)){
        errors.email = "Must not be empty"
    } else if(!isEmail(newUser.email)){
        errors.email = "Must be a valid email"
    }

    if(isEmpty(newUser.password)){
        errors.password = "Must not be empty"
    }

    if(newUser.password !== newUser.confirmPassword){
        errors.confirmPassword = "Passwords must match"
    }

    if(isEmpty(newUser.handle)){
        errors.handle = "Must not be empty"
    }

    //check the errors object before proceeding, to check if the errors object is empty
    if(Object.keys(errors).length > 0){
        return res.status(400).json(errors)
    }

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
            return res.status(500).json({error : err.code})
        }
    })
}

exports.login = (req, res) => {
    const user = {
        email : req.body.email,
        password : req.body.password
    }

    let errors ={}

    if(isEmpty(user.email)){
        errors.email = "Must not be empty"
    }

    if(isEmpty(user.password)){
        errors.password = "Must not be empty"
    }

    //check the errors object before proceeding, to check if the errors object is empty
    if(Object.keys(errors).length > 0){
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
        if(err.code === "auth/wrong-password"){
            return res.status(403).json({general : "Wrong password, try again"})
        }else{
            return res.status(500).json({error : err.code}) 
        }       
        
    })
}
