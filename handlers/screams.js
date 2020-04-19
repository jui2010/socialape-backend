const {db} = require('../util/admin')

exports.getAllScreams =  (req, res) => {
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let screams = []
        data.forEach((doc) => {
            screams.push({
                screamId : doc.id,
                ... doc.data()
            })
        })
        return res.json(screams)
    })
    .catch((err) => console.log(err))
}

exports.postOneScream = (req, res) => {
    if(req.body.body.trim() === ''){
        return res.status(400).json({body : "Must not be empty"})
    }

    let newScream = {
        body : req.body.body,
        userHandle : req.user.handle,
        createdAt : new Date().toISOString()
    }
    db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
        res.json({message : `document ${doc.id} is created successfully`})
    })
    .catch((err) => {
        res.status(500).json({error : 'something went wrong'})
        console.error(err)
    })
}