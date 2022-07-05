let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");

let buyerSchema = new mongoose.Schema({
  username: {type: String, unique: true, required: true},
  password: String,
  name: String,
  mobile: Number,
  addline1: String,
  addline2: String,
  city: String,
  zipcode: Number,
  state: String,
  country: String,
  items: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  }],
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart"
  }],
  cartTotal: Number,
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wishlist"
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

buyerSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Buyer", buyerSchema);
