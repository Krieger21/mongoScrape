var express = require("express")
var bodyparser = require("body-parser")
var mongoose = require("mongoose")
var cheerio = require("cheerio")
var axios = require("axios")

var db = require("./models")

var PORT = process.env.PORT || 5000

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongoHeadlines"

var app = express()

app.use(bodyparser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI)

app.get("/scrape", function(req, res) {
    var articleData = []
    db.Article.find({}).then(function(dbArticle){
        articleData = dbArticle
    }) 
    axios.get("https://old.reddit.com/").then(function(response) {
        var $ = cheerio.load(response.data);
        $("p.title").each(function(i, element) {
            
            var result = {};
            var title = $(this).children("a").text().split(" ", 3)

            function titleMaker(title) {
                title = title.join(" ")
                return title + "..."
            }

                result.title = titleMaker(title)
                result.summary = $(this)
                    .children("a")
                    .text()
                result.URL = $(this)
                  .children("a")
                  .attr("href");

                  db.Article.create(result)
                  .then(function(dbArticle) {
                      console.log("All new scrape")
                  })
                  .catch(function(err) {
          
                    console.log(err);
                  });
        })
        res.redirect("/")
    });
})

app.get("/articles", function(req, res) {
    db.Article.find({}, function(error, found) {
      if (error) {
        console.log(error)
      } else {
        res.json(found)
      }
    })
  });

  app.get("/articles/:id", function(req, res) {

    var id = req.params.id

    db.Article.findOne({_id: id})
  
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err) {

      res.json(err);
    });
  });

  app.post("/articles/:id", function(req, res) {

    db.Note.create(req.body)
    .then(function(dbNote) {
  
      return db.Article.findOneAndUpdate({ _id: req.params.id}, {note: dbNote._id}, {new: true })
    })
    .then(function(dbArticle) {
  
      res.json(dbArticle)
    })
    .catch(function(err) {
      res.json(err)
    })
  });

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });