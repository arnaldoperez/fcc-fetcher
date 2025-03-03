const express = require("express")
const app = express()
const cors = require("cors")
const jsonApp=require("./app")
require("dotenv").config()
app.use(cors())

const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data

var admin = require("firebase-admin");
var serviceAccount = require(`${process.env.FIREBASE_KEY}`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.put("/backup",upload.single('backupFile'),async (req, res) => {
  if (req.query.secret != process.env.SECRET) {
    return res.status(401).send("Unauthorized")
  }

  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }
  const { getStorage, uploadBytes,ref} = require('firebase-admin/storage');

  let bucket=getStorage().bucket("aperez-dev.appspot.com")
  const file = req.file;
  const fileName = "backup/"+file.originalname;
  await bucket.file(fileName).save(file.buffer)
  let kill=process.env.KILL=="0"
  res.status(200).send(kill?'Ok':'kill');

})

app.use(express.json(),jsonApp)


app.listen(3000, () => { console.log("Listeing on 3000 - " + process.env.NODE_ENV) })