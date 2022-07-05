let mongoose = require("mongoose");

let ItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  delivery: {
    type: String,
    minlength: 10,
    maxlength: 1000,
  },
  quantity: {
    type: Number,
    required: true
  },
  description: String,
  material: String,
  weight: Number,
  seller: String,
  sellerName: String,
  sellerMobile: Number,
  sellerId: String,
  sellerAddline1: String,
  sellerAddline2: String,
  sellerCity: String,
  sellerZipcode: Number,
  sellerState: String,
  sellerCountry: String,
  category: String,
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }],

});

module.exports = mongoose.model("Item", ItemSchema);
