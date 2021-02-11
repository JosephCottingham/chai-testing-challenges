require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_OBJECT_ID = 'aaaaaaaaaaaa' // 12 byte string
const SAMPLE_OBJECT_ID_2 = 'aaa3aaaaaaaa' // 12 byte string

describe('Message API endpoints', () => {
    beforeEach((done) => {
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: SAMPLE_OBJECT_ID
        })
        sampleUser.save().catch(err =>{
            console.log(err);
        })
        const sampleMessage = new Message({
            title: 'testtitle',
            body: 'testbody',
            author: sampleUser._id,
            _id: SAMPLE_OBJECT_ID_2,
        })
        sampleMessage.save().then(() => {
            done()
        }).catch(err =>{
            console.log(err);
        })
    })

    afterEach((done) => {
        User.deleteMany({ username: ['myuser'] }).then(() => {
            Message.deleteMany({ title: ['testtitle', 'anothertesttitle', 'anothertitle'] })
            .then(() => {
                done()
            })
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages').end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_OBJECT_ID_2}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body.title).to.equal('testtitle')
            expect(res.body.body).to.equal('testbody')
            done()
        })
    })

    it('should post a new message', (done) => {
        chai.request(app)
        .post('/messages')
        .send({title: 'anothertesttitle', body: 'anothertestbody', author: mongoose.Types.ObjectId(SAMPLE_OBJECT_ID)})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'anothertesttitle')

            Message.findOne({title: 'anothertesttitle'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${SAMPLE_OBJECT_ID_2}`)
        .send({title: 'anothertitle'})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'anothertitle')

            Message.findOne({title: 'anothertitle'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${SAMPLE_OBJECT_ID_2}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal('Successfully deleted.')

            Message.findOne({title: 'anothertitle'}).then(message => {
                expect(message).to.equal(null)
                done()
            })
        })
    })
})
