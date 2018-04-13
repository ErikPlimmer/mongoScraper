var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 80;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/motoscraper");

// Routes

app.get('/', function(req, res) {
  res.redirect('/articles');
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.motorcyclistonline.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("h3.pane-node-title").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

        if(result.title !== "" && result.link !== ""){
          //check for duplicates
     

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
      }
    
    });

    // If we were able to successfully scrape and save an Article redirect to home page
    res.redirect('/');
  });
  
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

// Route for deleting an Article by id 
app.get("/delete:id", function(req, res){

  db.Article.findOneAndDelete({_id: (req.params.id)})
  .then(function(dbArticle){
    console.log('delete');
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});

//Route for saving Articles to saved Article section 
app.get("/save:id", function(req, res){

  db.Article.findOneAndUpdate({        
    _id: req.params.id
  },
  { Saved: newArticle._id, boolean: true}, {new:true})
  .then(function(dbArticle){
    console.log('saved');
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article.findOne({_id: (req.params.id)})
  .populate("note")
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err){
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

  db.Note.create(req.body)
    .then(function(newNote){
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      },
      { note: newNote._id}, {new:true});
    })
    .then(function(dbNote) {
      res.json(dbNote);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for clearing all Articles for testing
app.get('/clearAll', function(req, res) {
  db.Article.remove({}, function(err, doc) {
      if (err) {
          console.log(err);
      } else {
          console.log('removed all articles');
      }

  });
  res.redirect('/');
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
