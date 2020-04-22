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
        createdAt : new Date().toISOString(),
        userImage : req.user.imageUrl,
        likeCount : 0, 
        commentCount : 0
    }
    db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
        const resScream = newScream //response scream
        resScream.screamId = doc.id
        res.json(resScream)
    })
    .catch((err) => {
        res.status(500).json({error : 'something went wrong'})
        console.error(err)
    })
}


//get a scream and all it details and comments .. with help of screamId
exports.getScream = (req, res) => {
    let screamData

    db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({error : 'Scream not found'})
        }
        screamData = doc.data()
        screamData.screamId = doc.id
        return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId' , '==' , req.params.screamId)
        .get()
    })
    .then(data => {
        screamData.comments = []
        data.forEach(doc => {
            screamData.comments.push(doc.data())
        })
        return res.json(screamData)
    })
    .catch((err) => {
        res.status(500).json({error : err.code})
        console.error(err)
    })
}


// Comment on a comment
exports.commentOnScream = (req, res) => {
    if (req.body.body.trim() === '')
      return res.status(400).json({ comment: 'Must not be empty' });
  
    const newComment = {
      body: req.body.body,
      createdAt: new Date().toISOString(),
      screamId: req.params.screamId,
      userHandle: req.user.handle,
      userImage: req.user.imageUrl
    };
    console.log(newComment);
  
    db.doc(`/screams/${req.params.screamId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({ error: 'Scream not found' });
        }
        else{
            return doc.ref.update({commentCount : doc.data().commentCount + 1})
        }
      })
      .then(() => {
        return db.collection('comments').add(newComment)
      })
      .then(() => {
        res.json(newComment);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: 'Something went wrong' });
      });
  };


  
// like a scream
exports.likeScream = (req, res) => {
  const likeDocument = db.collection('likes')
                          .where('userHandle' , '==' , req.user.handle)
                          .where('screamId' , '==' , req.params.screamId)
                          .limit(1)

  const screamDocument = db.doc(`/screams/${req.params.screamId}`)
    
  let screamData = {}

  screamDocument.get()
  .then(doc => {
    if(doc.exists){
      screamData = doc.data()
      screamData.screamId = doc.id
      return likeDocument.get()
    }else{
      return res.status(400).json({ error : 'Scream not found'})
    }
  })
  .then(data => {
    if(data.empty){ //check if data i.e. likes exists or no
      return db.collection('likes')
      .add({
        screamId : req.params.screamId,
        userHandle : req.user.handle
      })
      .then(() => {
        screamData.likeCount++
        return screamDocument.update({likeCount : screamData.likeCount})
      })
      .then(() => {
        return res.json(screamData)
      })
    }else{
      return res.status(400).json({error : 'Scream already liked'})
    }
  })
  .catch(err => {
    res.status(500).json({error : err.code})
  })
}

// unlike a scream
exports.unlikeScream = (req, res) => {
  const likeDocument = db.collection('likes')
                          .where('userHandle' , '==' , req.user.handle)
                          .where('screamId' , '==' , req.params.screamId)
                          .limit(1)

  const screamDocument = db.doc(`/screams/${req.params.screamId}`)
    
  let screamData = {}

  screamDocument.get()
  .then(doc => {
    if(doc.exists){
      screamData = doc.data()
      screamData.screamId = doc.id
      return likeDocument.get()
    }else{
      return res.status(400).json({ error : 'Scream not found'})
    }
  })
  .then(data => {
    if(data.empty){ //check if data i.e. likes exists or no
      return res.status(400).json({error : 'Scream not liked'})
    }else{
      return db.doc(`/likes/${data.docs[0].id}`).delete()
        .then(() => {
          screamData.likeCount --
          return screamDocument.update({likeCount : screamData.likeCount})
        })
        .then(() => {
          res.json(screamData)
        })
    }
  })
  .catch(err => {
    res.status(500).json({error : err.code})
  })
}

//delete scream
exports.deleteScream = (req, res) => {
  const document = db.doc(`screams/${req.params.screamId}`)

  document.get()
  .then(doc => {
    if(!doc.exists){
      return res.status(404).json({error : 'Scream not found'})
    }

    //check if the scream which is to de deleted , belongs to the person logged in, ie he doesnt delete someone elses scream
    if(doc.data().userHandle !== req.user.handle){
      return res.status(403).json({ error : 'Un-Authorised'})
    } else{
      return document.delete()
    }
  })
  .then(() => {
    res.json({message : 'Scream deleted successfully'})
  })
  .catch(err => {
    return res.status(500).json({ error : err.code})
  })
}