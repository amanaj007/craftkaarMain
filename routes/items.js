//jshint esversion:8
let express = require("express");
let router = express.Router();
let Item = require("../models/item");
let Category = require("../models/category");
let mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");

//index- show all items
router.get("/", function(req, res) {
  let noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Item.find({
      name: regex
    }, function(err, allitems) {
      if (err) {
        console.log(err);
      } else {
        if (allitems.length < 1) {
          noMatch = "No items match that query, please try again.";
        }
        res.render("items/items", {
          items: allitems,
          currentSeller: req.user,
          noMatch: noMatch
        });
      }
    });
  } else {
    Item.find({}, function(err, allitems) {
      if (err) {
        console.log(err);
      } else {
        res.render("items/items", {
          items: allitems,
          currentSeller: req.user,
          noMatch: noMatch
        });
      }
    });
  }
});

//shows more info about one item
router.get("/:id", function(req, res) {
  Item.findById(req.params.id).populate("reviews").exec(function(err, foundItem) {
    if (err) {
      console.log(err);
    } else {
      let tui = foundItem;
      console.log(tui.category);
      Category.find({name: foundItem.category}).populate("items").exec(function(err, cattItems){

        console.log(cattItems);
    
        res.render("items/show", {
          item: foundItem, cattitems: cattItems
        });
      });
    }
  });
});


router.get("/category/:name", function(req, res){
  Category.find({name: req.params.name}).populate("items").exec(function(err, cattItems){
        console.log(cattItems);
    res.render("items/Category", {
      cattitems: cattItems
    });
  });
});




function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/signin");
}



function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;
