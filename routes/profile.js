//jshint esversion:8
let express = require("express");
let router = express.Router();
let Buyer = require("../models/buyer");
let passport = require("passport");
let Item = require("../models/item");
let Order = require("../models/order");

//buyer account
router.get("/profile/:id", checkUser, function(req, res) {
  Buyer.findById(req.params.id, function(err, foundUser) {
      res.render("profile/profile", {
        user: foundUser
      });
  });
});


//Order
router.get("/profile/:id/order", checkUser, function(req, res) {
  Buyer.findById(req.params.id).populate("orders").exec(function(err, foundItem) {
      res.render("profile/order", {
        item: foundItem });
  });
});



//reviews
router.get("/profile/:id/reviews", checkUser, function(req, res) {
  Buyer.findById(req.params.id).populate("reviews").exec(function(err, foundUser) {
      res.render("profile/reviews", {
        user: foundUser
      });
  });
});


router.get("/profile/:id/settings", checkUser, function(req, res) {
  Buyer.findById(req.params.id).populate("reviews").exec(function(err, foundUser) {
      res.render("profile/settings", {
        user: foundUser
      });
  });
});


router.put("/profile/:id/profile", checkUser, function(req, res){
  Buyer.findByIdAndUpdate(req.params.id, req.body, function(err, updatedProfile){
      res.redirect("/");
  });
});


router.get("/profile/:id/cart", checkUser, function(req, res) {
  Buyer.findById(req.params.id).populate("cart").exec(function(err, foundUser) {
      res.render("profile/cart", {
        user: foundUser
      });
  });
});


router.get("/profile/:id/wishlist", checkUser, function(req, res) {
  Buyer.findById(req.params.id).populate("cart").exec(function(err, foundUser) {
      res.render("profile/wishlist", {
        user: foundUser
      });
  });
});


function checkUser(req, res, next){
  if(req.isAuthenticated()){
        if(req.params.id == req.user._id){
          next();
        } else {
          res.redirect("back");
        }
  } else {
    res.redirect("back");
  }
}


module.exports = router;
