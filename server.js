const express = require('express');
const multer = require('multer');
const {Storage} = require('@google-cloud/storage');
const vision = require('@google-cloud/vision');

const app = express();
const upload = multer({dest: 'uploads/'});

// Instantiates a client
const storage = new Storage();
const client = new vision.ImageAnnotatorClient();

app.post('/guess', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image uploaded');
  }

  // Uploads the image to Google Cloud Storage
  const bucket = storage.bucket('my-image-bucket');
  const file = bucket.file(req.file.originalname);
  file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  }).end(req.file.buffer);

  // Performs label detection on the image file
  client
    .labelDetection(`gs://my-image-bucket/${req.file.originalname}`)
    .then(results => {
      const labels = results[0].labelAnnotations;
      res.send(labels.map(label => label.description));
    })
    .catch(err => {
      console.error('ERROR:', err);
      res.status(500).send('Error while guessing image contents');
    });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
