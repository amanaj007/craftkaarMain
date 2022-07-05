let express = require("express");
let router = express.Router({
  mergeParams: true
});
let Review = require("../models/review");
let Item = require("../models/item");


//reviews routes
router.get("/new", isLoggedIn, function(req, res) {
  Item.findById(req.params.id, function(err, item) {
    if (err) {
      console.log(err);
    } else {
      res.render("reviews/new", {
        item: item
      });
    }
  });
});


router.get("/:review_id/edit", checkReviewOwnership, function(req, res) {
  Review.findById(req.params.review_id, function(err, foundReview){
    if(err){
      console.log(err);
    } else {
      res.render("reviews/edit", {item_id: req.params.id, review: foundReview});
    }
  });
});


router.put("/:review_id", checkReviewOwnership, function(req, res){
  Review.findByIdAndUpdate(req.params.review_id, req.body.review, function(err, updatedReview){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/items/" + req.params.id);
    }
  });
});


router.delete("/:review_id", checkReviewOwnership, function(req, res){
  Review.findByIdAndRemove(req.params.review_id, function(err){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/items/" + req.params.id);
    }
  });
});



//
router.get("/:id", function(req, res) {
  Item.findById(req.params.id).populate("reviews").exec(function(err, foundItem) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundItem);
      res.render("reviews/reviews", {
        item: foundItem
      });
    }
  });
});




router.get("/", function(req, res) {
  Item.findById(req.params.id).populate("reviews").exec(function(err, item) {
    if (err) {
      console.log(err);
    } else {
      console.log(item);
      res.render("reviews/reviews", {
        item: item
      });
    }
  });
});


router.post("/", isLoggedIn, function(req, res) {
  Item.findById(req.params.id, function(err, item) {
    if (err) {
      console.log(err);
      res.redirect("/items");
    } else {
      Review.create(req.body.review, function(err, review) {
        if (err) {
          console.log(err);
        } else {
          review.author.id = req.user._id;
          review.author.username = req.user.name;
          review.save();
          item.reviews.push(review);
          item.save();
          res.redirect('/items/' + item._id);
        }
      });
    }
  });
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/signin");
}


function checkReviewOwnership(req, res, next){
  if(req.isAuthenticated()){
    Review.findById(req.params.review_id, function(err, foundReview){
      if(err){
        res.redirect("back");
      } else {
        console.log("this is what you are looking for" + foundReview.author.id + " OKay?");
        if(foundReview.author.id.equals(req.user._id)){
          next();
        } else {
          res.redirect("back");
        }
      }
    });
  } else {
    res.redirect("back");
  }
}

module.exports = router;
