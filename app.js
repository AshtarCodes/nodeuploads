const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const url = require('url')

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 100000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|mp4/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

// Init app
const app = express();

// EJS
app.set('view engine', 'ejs');

// Public Folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('index'));

app.post('/upload', (req, res) => {
  
  upload(req, res, (err) => {
    console.log(convertTwitchClip(req.body.clip, 'twitch-embed-ash.herokuapp.com', 'https://twitch-embed-ash.herokuapp.com/upload','twitch-embed-ash.herokuapp.com/upload','www.twitch-embed-ash.herokuapp.com/upload'))
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      if(req.file == undefined){
        res.render('index', {
          msg: 'Error: No File Selected!'
        });
      } else {
        res.render('index', {
          msg: 'File Uploaded!',
          file: `uploads/${req.file.filename}`,
          embed: convertTwitchClip(req.body.clip, 'twitch-embed-ash.herokuapp.com', 'https://twitch-embed-ash.herokuapp.com/upload','twitch-embed-ash.herokuapp.com/upload','www.twitch-embed-ash.herokuapp.com/upload')
        });
      }
    }
  });
});
// goal: to filter for a twitch clip and modify the parent query param on it
function videoOrigin (videoURL){
  let origin = new URL(videoURL).hostname
  return origin;
}
function repeatURLParams (urlParam, arr){
  let output = '';
  for (let str of arr){
    output += `${urlParam}${str}`
  }
  return output;
}
function convertTwitchClip (...arguments) {
let [videoURL, ...parents] = arguments
let parentSiteParams = repeatURLParams('&parent=',parents)
console.log(parentSiteParams)
const url = new URL(videoURL)
let embeddableURL;
if (url.hostname === 'clips.twitch.tv'){
  // if it's an embed link in the following format: https://clips.twitch.tv/embed?clip=CleverDependablePoultryLitFam-_dTbDHINZ38jB7eg&parent=localhost:3000
  embeddableURL = `${url.origin + url.pathname + url.searchParams.get("clip") + parentSiteParams}`
  // embeddableURL must have an SSL certificate for twitch embeds
  return embeddableURL;
} else if (url.hostname === 'www.twitch.tv'){
  // if it's a stadard clip link in the following format: https://www.twitch.tv/learnwithleon/clip/CleverDependablePoultryLitFam-_dTbDHINZ38jB7eg
  let pathnames = url.pathname;
  let pathnamesArr = String(pathnames).split('/') 
  let clipParam = pathnamesArr[pathnamesArr.length-1] 
  embeddableURL = `https://clips.twitch.tv/embed?clip=${clipParam + parentSiteParams}`
  return embeddableURL;
}
}
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Server started on port ${port}`));