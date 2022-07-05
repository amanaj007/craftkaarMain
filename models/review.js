let mongoose = require("mongoose");

let reviewSchema = mongoose.Schema({
  text: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer"
    },
    username: String
  }
});

module.exports = mongoose.model("Review", reviewSchema);