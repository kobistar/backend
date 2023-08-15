import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../app.js' // Adjust the path to your app.js file

chai.use(chaiHttp)
const expect = chai.expect

describe('POST /gallery', () => {
  it('should create a new gallery', (done) => {
    const galleryData = {
      name: '',
    }

    chai
      .request(app)
      .post('/gallery')
      .send(galleryData)
      .end((err, res) => {
        expect(res).to.have.status(201)
        expect(res.body.name).to.equal(galleryData.name)
        done()
      })
  })
})
