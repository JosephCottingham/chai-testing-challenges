const express = require('express')
const router = express.Router();

const mongoose = require('mongoose')
const User = require('../models/user')
const Message = require('../models/message')

/** Route to get all messages. */
router.get('/', (req, res) => {
    Message.find({}, function(err, messages) {
        return res.json({messages})
    });
})

/** Route to get one message by id. */
router.get('/:messageId', (req, res) => {
    Message.findById({_id : req.params.messageId}, function(err, message){
        res.send(message)
    });
})

/** Route to add a new message. */
router.post('/', (req, res) => {
    let message = new Message(req.body)
    message.save()
    .then(message => {
        return User.findById(message.author)
    })
    .then(user => {
        user.messages.unshift(message)
        return user.save()
    })
    .then(() => {
        return res.send({message})
    }).catch(err => {
        throw err.message
    })
})

/** Route to update an existing message. */
router.put('/:messageId', (req, res) => {
    Message.findByIdAndUpdate(req.params.messageId, {$set:{title:req.body.title, body:req.body.body}}, {new:true}, function(err, message){
        console.log(message);
        res.send({message: message});
    }).catch((err)=>{
        reject(err);
     });
})

/** Route to delete a message. */
router.delete('/:messageId', (req, res) => {
    Message.findByIdAndRemove(req.params.messageId, function(err, message){
        User.deleteMany({messages: req.params.messageId}, function(err, message){
            res.send({message: 'Successfully deleted.'})
        })
    });
})

module.exports = router