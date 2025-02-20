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


exports.validateSignupData = (data) => {
    let errors ={}

    if(isEmpty(data.email)){
        errors.email = "Must not be empty"
    } else if(!isEmail(data.email)){
        errors.email = "Must be a valid email"
    }

    if(isEmpty(data.password)){
        errors.password = "Must not be empty"
    }

    if(data.password !== data.confirmPassword){
        errors.confirmPassword = "Passwords must match"
    }

    if(isEmpty(data.handle)){
        errors.handle = "Must not be empty"
    }

    //check the errors object before proceeding, to check if the errors object is empty

    return{
        errors,
        valid : Object.keys(errors).length === 0 ? true : false 
    }
}

exports.validateLoginData = (data) => {
    let errors ={}

    if(isEmpty(data.email)){
        errors.email = "Must not be empty"
    }

    if(isEmpty(data.password)){
        errors.password = "Must not be empty"
    }

    //check the errors object before proceeding, to check if the errors object is empty
    return{
        errors,
        valid : Object.keys(errors).length === 0 ? true : false 
    }

}

exports.reduceUserDetails = (data) => {
    let userDetails = {}

    if(!isEmpty(data.bio.trim())){
        userDetails.bio = data.bio
    }

    //check if the website link submitted has a http or no
    if(!isEmpty(data.website.trim())){
        if(data.website.trim().substring(0, 4) !== 'http'){
            userDetails.website = `http://${data.website.trim()}`
        }else {
            userDetails.website = data.website.trim()
        }
    }

    if(!isEmpty(data.location.trim())){
        userDetails.location = data.location
    } 

    return userDetails
}