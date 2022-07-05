//jshint esversion:6
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let mongoose = require("mongoose");
let passport = require("passport");
let flash = require("connect-flash");
let LocalStrategy = require("passport-local");
let GoogleStrategy = require('passport-google-oauth20').Strategy;
let FacebookStrategy = require('passport-facebook').Strategy;
let methodOverride = require("method-override");
let dotenv = require("dotenv");
dotenv.config();
let Review = require("./models/review");
let Item = require("./models/item");
let Buyer = require("./models/buyer");
let session = require("express-session");
let MongoStore = require("connect-mongo")(session);
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
let Order = require("./models/order");
let Torder = require("./models/torder");
let nodemailer = require("nodemailer");
const cors = require('cors');

let reviewRoutes = require("./routes/reviews");
let itemRoutes = require("./routes/items");
let indexRoutes = require("./routes/index");
let profileRoutes = require("./routes/profile");


let PORT = process.env.PORT || 3000;

const mongoURI = process.env.MONGODB_URL;
//mongodb://Localhost/newdb

mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
const conn = mongoose.connection;
let gfs;

conn.once("open", () =>{
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

// const mongoURI = "mongodb://Localhost:27017/newdb";

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
let Seller = require("./models/user");
app.use(flash());

app.use(session({
  secret: "Dead will rise again.",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }),
  cookie: {
    maxAge: 180 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("uploads"));

app.use(
    cors({
        origin: "http://Localhost:3000",
    })
);

passport.use(new LocalStrategy(Buyer.authenticate()));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLESTRATEGY_CLIENTID,
    clientSecret: process.env.GOOGLESTRATEGY_CLIENTSECRET,
    callbackURL: process.env.GOOGLE_CALLBACKURL
  },
  function(accessToken, refreshToken, profile, done) {
        Buyer.findOne({username: profile.emails[0].value
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                user = new Buyer({
                    name: profile.displayName,
                    username: profile.emails[0].value,
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }
));


passport.serializeUser(Buyer.serializeUser());
passport.deserializeUser(Buyer.deserializeUser());


app.use(function(req, res, next) {
  res.locals.currentBuyer = req.user;
  res.locals.session = req.session;
  next();
});


app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.session = req.session;
  next();
});


app.use("/", indexRoutes);
app.use("/items", itemRoutes);
app.use("/items/:id/reviews", reviewRoutes);
app.use("/", profileRoutes);


app.get("/image/:filename", function(req, res){
  gfs.files.findOne({filename: req.params.filename}, function(err, file){
    if(err){
      console.log(err);
    } else {
      const readstream = gfs.createReadStream(file.filename);
      console.log("sada"+ file.filename);
      readstream.pipe(res);
    }
  });
});


app.get("/data", function(req, res) {
  let skip = Number(req.query.skip) || 0;
  let limit = Number(req.query.limit) || 10;
  let sort = JSON.parse(JSON.stringify(req.query.sort));
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 5;

  skip = skip < 0 ? 0 : skip;
  limit = Math.min(50, Math.max(1, limit));
  console.log(sort);
  console.log(req.query);

  Item.find({}).sort({ price : sort}).skip(skip).limit(limit).then((item) => {
  res.send({item: item});
});

});


app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  function(req, res) {
    res.redirect('/items');
});


app.get("/return", function(req, res){
  res.render("returnscancels/return");
});


app.post("/return", function(req, res){
      res.redirect("/selectorder/" + req.body.email);
});


app.get("/selectorder/:email", function(req, res){
  Order.find({buyerEmail:req.params.email}, function(err, result){
    if(result){
      console.log(result);
      res.render("returnscancels/selectorder", {results:result});
    } else {
      Torder.find({buyerEmail:req.params.email}, function(err, result){
        res.render("returnscancels/selectorder", {results:result});
      });
    }
  });
});


app.get("/returns/:id", function(req, res){
  Order.findById(req.params.id, function(err, result){
    if(result){
      let transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD
        }
      });

      let mailOptions = {
        from: process.env.USER_EMAIL,
        to: result.sellerEmail,
        bcc: process.env.USER_EMAIL,
        subject: 'Craftkaar order return request',
        text: "The user: " + result.buyerName + ", email: " + result.buyerEmail + ", mobile: " + result.buyerMobile +
        "address: " + result.buyerAddline1 + ", " + result.buyerAddline2 + "," + result.buyerCity + ", " + result.buyerZipcode +
        ", " + result.buyerState + ", " + result.buyerCountry + ", has requested for return of the order: " + result.name +
        " with quantity: " + result.qty + " with price: " + result.price + " and amount: " + result.amount + ", kindly see to it."
      };

      transporter.sendMail(mailOptions, function(err, info){
        if(err){
        } else {

        }
      });

      Order.findByIdAndRemove(req.params.id, function(err, result){
        if(err){
          console.log(err);
        } else{
          console.log(result);
        }
      });

      console.log(result);
      res.render("returnscancels/returnrequest");
    } else {
      Torder.findById(req.params.id, function(err, result){

        let transporter = nodemailer.createTransport({
          host: "smtpout.secureserver.net",
          secure: false,
          auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
          }
        });

        let mailOptions = {
          from: process.env.USER_EMAIL,
          to: result.sellerEmail,
          bcc: process.env.USER_EMAIL,
          subject: 'Craftkaar order return request',
          text: "The user: " + result.buyerName + ", email: " + result.buyerEmail + ", mobile: " + result.buyerMobile +
          "address: " + result.buyerAddline1 + ", " + result.buyerAddline2 + "," + result.buyerCity + ", " + result.buyerZipcode +
          ", " + result.buyerState + ", " + result.buyerCountry + ", has requested for return of the order: " + result.name +
          " with quantity: " + result.qty + " with price: " + result.price + " and amount: " + result.amount + ", kindly see to it."
        };

        transporter.sendMail(mailOptions, function(err, info){
          if(err){
          } else {

          }
        });

        Torder.findByIdAndRemove(req.params.id, function(err, result){
          if(err){
            console.log(err);
          } else{
            console.log(result);
          }
        });

        res.render("returnscancels/returnrequest");
      });
    }
  });
});


app.get("/cancels/:id", function(req, res){
  Order.findById(req.params.id, function(err, result){
    if(result){

      let transporter = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD
        }
      });

      let mailOptions = {
        from: process.env.USER_EMAIL,
        to: result.sellerEmail,
        bcc: process.env.USER_EMAIL,
        subject: 'Craftkaar order cancel request',
        text: "The user: " + result.buyerName + ", email: " + result.buyerEmail + ", mobile: " + result.buyerMobile +
        "address: " + result.buyerAddline1 + ", " + result.buyerAddline2 + "," + result.buyerCity + ", " + result.buyerZipcode +
        ", " + result.buyerState + ", " + result.buyerCountry + ", has requested for cancellation of the order: " + result.name +
        " with quantity: " + result.qty + " with price: " + result.price + " and amount: " + result.amount + ", kindly see to it."
      };

      transporter.sendMail(mailOptions, function(err, info){
        if(err){
        } else {

        }
      });

      Order.findByIdAndRemove(req.params.id, function(err, result){
        if(err){
          console.log(err);
        } else{
          console.log(result);
        }
      });

      console.log(result);
      res.render("returnscancels/cancelrequest");
    } else {
      Torder.findById(req.params.id, function(err, result){

        let transporter = nodemailer.createTransport({
          host: "smtpout.secureserver.net",
          secure: false,
          auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
          }
        });

        let mailOptions = {
          from: process.env.USER_EMAIL,
          to: result.sellerEmail,
          bcc: process.env.USER_EMAIL,
          subject: 'Craftkaar order cancel request',
          text: "The user: " + result.buyerName + ", email: " + result.buyerEmail + ", mobile: " + result.buyerMobile +
          "address: " + result.buyerAddline1 + ", " + result.buyerAddline2 + "," + result.buyerCity + ", " + result.buyerZipcode +
          ", " + result.buyerState + ", " + result.buyerCountry + ", has requested for cancellation of the order: " + result.name +
          " with quantity: " + result.qty + " with price: " + result.price + " and amount: " + result.amount + ", kindly see to it."
        };

        transporter.sendMail(mailOptions, function(err, info){
          if(err){
          } else {

          }
        });

        Torder.findByIdAndRemove(req.params.id, function(err, result){
          if(err){
            console.log(err);
          } else{
            console.log(result);
          }
        });

        res.render("returnscancels/cancelrequest");
      });
    }
  });
});


app.get("/about", function(req, res){
  res.render("about");
});

app.get("/returnpolicy", function(req, res){
  res.render("returnpolicy");
});

app.get("/privacypolicy", function(req, res){
  res.render("privacypolicy");
});

app.get("/termsandconditions", function(req, res){
  res.render("termsandconditions");
});

let server = app.listen(PORT, function() {
  console.log("Server has started.");
});

server.keepAliveTimeout = 30000;
server.headersTimeout = 65*1000;