let mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  }]
});


module.exports = mongoose.model("Seller", userSchema);