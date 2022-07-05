//jshint esversion:8
let express = require("express");
let router = express.Router();
let Buyer = require("../models/buyer");
let passport = require("passport");
let Item = require("../models/item");
let Category = require("../models/category");
let Cart = require("../models/cart");
let Order = require("../models/order");
let Torder = require("../models/torder");
let TCart = require("../models/tcart");
let mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const fs = require("fs");
const PDFDocument = require("pdfkit");
let async = require("async");
let nodemailer = require("nodemailer");
let crypto = require("crypto");
const shortid = require('shortid');
let Razorpay = require("razorpay");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");


dotenv.config();
router.use(express.json());
router.use(bodyParser.urlencoded({
  extended:false
}));


router.use(bodyParser.json());

const instance = new Razorpay({
	key_id: process.env.KEY_ID,
	key_secret: process.env.KEY_SECRET
});

let dateObj = new Date();
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
let month = months[dateObj.getUTCMonth()];
let day = dateObj.getUTCDate();
let year = dateObj.getUTCFullYear();
newdate = day + "/" + month + "/" + year;


router.get("/checkout", isLoggeIn, (req, res) => {
  res.render("payment/usrd", {key: process.env.KEY_ID});
});


router.get("/buyn/:id", function(req, res){
  if(req.user){
    Buyer.findOne(req.user._id).populate("cart").exec(function(err, gotBuyer){
      if(err){
      } else {
        Item.findById(req.params.id, function(err, gotItem){
          if(err){
          } else {
  const cart = gotBuyer.cart.find(cart => cart.id === req.params.id);
  if(cart !== undefined && cart.id === req.params.id){
    cart.qty++;
    cart.amount = cart.price * cart.qty;
    cart.save();
    res.redirect('/bfirst');
  } else {
    let kuchItem = new Cart({items: req.params.id, id: req.params.id, name: gotItem.name, image: gotItem.image, price: gotItem.price, amount: gotItem.price, sellerEmail: gotItem.seller, sellerName: gotItem.sellerName, sellerMobile: gotItem.sellerMobile,
    sellerAddline1: gotItem.sellerAddline1,
    sellerAddline2: gotItem.sellerAddline2,
    sellerCity: gotItem.sellerCity,
    sellerZipcode: gotItem.sellerZipcode,
    sellerState: gotItem.sellerState,
    sellerCountry: gotItem.sellerCountry,
    buyerEmail: gotBuyer.username,
    buyerName: gotBuyer.name,
    buyerMobile: gotBuyer.mobile,
    buyerAddline1: gotBuyer.addline1,
    buyerAddline2: gotBuyer.addline2,
    buyerCity: gotBuyer.city,
    buyerZipcode: gotBuyer.zipcode,
    buyerState: gotBuyer.state,
    buyerCountry: gotBuyer.country});
          Cart.create(kuchItem, function(err, cartItem){
          gotBuyer.cart.id = req.params.id;
          gotBuyer.cart.name = gotItem.name;
          gotBuyer.cart.image = gotItem.image;
          gotBuyer.cart.price = gotItem.price;
          gotBuyer.cart.amount = gotBuyer.cart.price * gotBuyer.cart.qty;
          gotBuyer.cart.sellerEmail = gotItem.sellerEmail;
          gotBuyer.cart.sellerName = gotItem.sellerName;
          gotBuyer.cart.sellerMobile = gotItem.sellerMobile;
          gotBuyer.cart.sellerAddline1 = gotItem.sellerAddline1;
          gotBuyer.cart.sellerAddline2 = gotItem.sellerAddline2;
          gotBuyer.cart.sellerCity = gotItem.sellerCity;
          gotBuyer.cart.sellerZipcode = gotItem.sellerZipcode;
          gotBuyer.cart.sellerState = gotItem.sellerState;
          gotBuyer.cart.sellerCountry = gotItem.sellerCountry;
          gotBuyer.cart.buyerEmail = gotBuyer.username;
          gotBuyer.cart.buyerName = gotBuyer.name;
          gotBuyer.cart.buyerMobile = gotBuyer.mobile;
          gotBuyer.cart.buyerAddline1 = gotBuyer.addline1;
          gotBuyer.cart.buyerAddline2 = gotBuyer.addline2;
          gotBuyer.cart.buyerCity = gotBuyer.city;
          gotBuyer.cart.buyerZipcode = gotBuyer.zipcode;
          gotBuyer.cart.buyerState = gotBuyer.state;
          gotBuyer.cart.buyerCountry = gotBuyer.country;
            gotBuyer.cart.push(cartItem);
            gotBuyer.cartTotal += gotItem.price;
            gotBuyer.save();


            }
          );

          res.redirect('/bfirst');
          }
        }
      });
    }});
  } else {
    let productId = req.params.id;
    let cart = new TCart(req.session.cart ? req.session.cart : {items: {}});
    Item.findById(productId, function(err, product){
      if(err){
        return res.redirect('/items/:id');
      }
      cart.add(product, product.id);
      req.session.cart = cart;
      res.redirect('/bfirst');
    });
  }
});



router.get("/bfirst", isLoggeIn, function(req, res){
if(req.user){
  Buyer.findById(req.user._id, function(err, user){
      res.render("payment/bfirst", {user: user});
  });
} else {
  res.render("payment/bfirst");
}
});


router.put("/bfirstt/:id", isLoggeIn, function(req, res){
  Buyer.findByIdAndUpdate(req.params.id, req.body, function(err, updatedBuyer){
    if(err){
      res.redirect("back");
    } else {
      res.redirect("/bsecond");
    }
  });
});


router.post("/bfirst", isLoggeIn, function(req, res){
  console.log("okau");
  req.session.cartBuyer = req.body;
  console.log("okau");
  console.log(req.session.cartBuyer);
  console.log(req.body);
  res.redirect("/bsecond");
});


router.get("/bsecond", isLoggeIn, function(req, res){
  res.render("payment/bsecond");
});


router.get("/add-cart/:id", function(req, res) {
  let productId = req.params.id;
  let cart = new TCart(req.session.cart ? req.session.cart : {items: {}});
  Item.findById(productId, function(err, product){
    if(err){
      return res.redirect('/tcart');
    }
    cart.add(product, product.id);
    req.session.cart = cart;
    res.redirect('/tcart');
  });
});


router.get("/tcart",  function(req, res){
  if(req.user){res.redirect("/cart");} else {
if(!req.session.cart){
  return res.render("shop/tcart.hbs", {products:null});
} else {
  let cart = new TCart(req.session.cart);
  res.render("shop/tcart.hbs" , {products: cart.generateArray(), totalPrice: cart.totalPrice});
}}
});


router.get("/api/payment/order", async (req, res) => {
  if(req.user){
    const doc = await Buyer.findOne(req.user._id);
    const doct = doc.cartTotal;
    let params = {
          amount: String(doct * 100),
          currency: "INR",
          receipt: "craftkaar001",
          payment_capture: "1"
        };
    arams = params;
    instance.orders
    .create(arams)
    .then((data) => {
      res.send({sub: data, status: "success"});
    })
    .catch((error) => {
      res.send({sub: error, status: "failed"});
    });
  } else {
    const doct = new TCart(req.session.cart);
    const doctt = doct.totalPrice;
    let para = {
          amount: String(doctt * 100),
          currency: "INR",
          receipt: "craftkaar001",
          payment_capture: "1"
        };
    param = para;
    instance.orders
    .create(param)
    .then((data) => {
      res.send({sub: data, status: "success"});
    })
    .catch((error) => {
      res.send({sub: error, status: "failed"});
    });
  }
});


router.post("/api/payment/verify", (req, res) => {
  console.log(req.body);
  body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  let expectedSignature = crypto
  .createHmac("sha256", process.env.KEY_SECRET).update(body.toString())
  .digest("hex");
  let response;
  console.log(expectedSignature + " " + req.body.razorpay_signature);
  if(expectedSignature === req.body.razorpay_signature){
    response = {status: "success"};
      } else {
        response = {status: "failure"};
      }
   res.send(response);
});


router.post("/api/payment/verify", (req, res) => {
  body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  let expectedSignature = crypto
  .createHmac("sha256", process.env.KEY_SECRET).update(body.toString())
  .digest("hex");
  let response = {status: "failure"};
  console.log(expectedSignature + " " + req.body.razorpay_signature);
  if(expectedSignature === req.body.razorpay_signature){
    response = {status: "success"};
    if(req.session.cart){
      let cart = new TCart(req.session.cart);
      let user = req.session.cartBuyer;
      console.log("sdasa" + req.session.cartBuyer);
      let rE = cart.generateArray().length - 1;
      cart.generateArray().forEach(function(item, i){

        let tY = new Torder({items: item.item._id, id: item.item._id, name: item.item.name, qty: item.qty, price: item.item.price, image: item.item.image, amount: item.item.price * item.qty, sellerEmail: item.item.seller, sellerName: item.item.sellerName, sellerMobile: item.item.sellerMobile, buyerEmail: user.username, buyerName: user.name, buyerMobile: user.mobile, buyerAddline1: user.addline1, buyerAddline2: user.addline2, buyerCity: user.city, buyerZipcode: user.zipcode, buyerState: user.state, buyerCountry: user.country, sellerAddline1: item.item.sellerAddline1, sellerAddline2: item.item.sellerAddline2, sellerCity: item.item.sellerCity,
        sellerZipcode: item.item.sellerZipcode,
        sellerState: item.item.sellerState,
        sellerCountry: item.item.sellerCountry, paymentId: req.body.razorpay_payment_id});
        Torder.create(tY, function(err, orderItem){

          function createInvoice(invoice, path) {
            let doc = new PDFDocument({ size: "A4", margin: 50 });

            generateHeader(doc);
            generateCustomerInformation(doc, invoice);
            generateInvoiceTable(doc, invoice);
            generateFooter(doc);

            doc.end();
            doc.pipe(fs.createWriteStream(path));
          }


          function generateHeader(doc) {
            doc
              .image("../main/public/images/craftkaa.png", 50, 45, { width: 70 })
              .fillColor("#444444")
              .fontSize(20)
              .text("", 110, 57)
              .fontSize(10)
              .text(orderItem.sellerEmail, 200, 50, { align: "right" })
              .text(orderItem.sellerAddline1, 200, 65, { align: "right" })
              .text(orderItem.sellerAddline2, 200, 80, { align: "right" })
              .text(orderItem.sellerCity, 200, 95, { align: "right" })
              .text(orderItem.sellerZipcode, 200, 110, { align: "right" })
              .text(orderItem.sellerState, 200, 125, { align: "right" })
              .text(orderItem.sellerCountry, 200, 140, { align: "right" })
              .moveDown();
          }



          function generateCustomerInformation(doc, invoice) {
            doc
              .fillColor("#444444")
              .fontSize(20)
              .text("Invoice", 50, 160);

            generateHr(doc, 185);

            const customerInformationTop = 200;

            doc
              .fontSize(10)
              .text("Invoice Number:", 50, customerInformationTop)
              .font("Helvetica-Bold")
              .text(invoice.invoice_nr, 150, customerInformationTop)
              .font("Helvetica")
              .text("Invoice Date:", 50, customerInformationTop + 15)
              .text(formatDate(new Date()), 150, customerInformationTop + 15)
              .text("GST:", 50, customerInformationTop + 30)
              .text("", 150, customerInformationTop + 30)

              .font("Helvetica-Bold")
              .text(invoice.shipping.name, 300, customerInformationTop)
              .font("Helvetica")
              .text(invoice.shipping.address + ", " + invoice.shipping.address2, 300, customerInformationTop + 15)
              .text(
                invoice.shipping.city +
                  ", " +
                  invoice.shipping.state +
                  ", " +
                  invoice.shipping.country + ", " + invoice.shipping.postal_code,
                300,
                customerInformationTop + 30
              )
              .moveDown();

            generateHr(doc, 252);
          }

          function generateInvoiceTable(doc, invoice) {
            let i;
            const invoiceTableTop = 330;

            doc.font("Helvetica-Bold");
            generateTableRow(
              doc,
              invoiceTableTop,
              "Item",
              "Description",
              "Unit Cost",
              "Quantity",
              "Line Total"
            );
            generateHr(doc, invoiceTableTop + 20);
            doc.font("Helvetica");

            for (i = 0; i < invoice.items.length; i++) {
              const item = invoice.items[i];
              const position = invoiceTableTop + (i + 1) * 30;
              generateTableRow(
                doc,
                position,
                item.item,
                item.description,
                formatCurrency(item.amount / item.quantity),
                item.quantity,
                formatCurrency(item.amount)
              );

              generateHr(doc, position + 20);
            }

            const subtotalPosition = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
              doc,
              subtotalPosition,
              "",
              "",
              "Subtotal",
              "",
              formatCurrency(invoice.subtotal)
            );

            const paidToDatePosition = subtotalPosition + 20;
            generateTableRow(
              doc,
              paidToDatePosition,
              "",
              "",
              "",
              "",
            );

            const duePosition = paidToDatePosition + 25;
            doc.font("Helvetica-Bold");
            generateTableRow(
              doc,
              duePosition,
              "",
              "",
              "",
              "",
            );
            doc.font("Helvetica");
          }

          function generateFooter(doc) {
            doc
              .fontSize(10)
              .text(
                "Thank you for your business.",
                50,
                780,
                { align: "center", width: 500 }
              );
          }

          function generateTableRow(
            doc,
            y,
            item,
            description,
            unitCost,
            quantity,
            lineTotal
          ) {
            doc
              .fontSize(10)
              .text(item, 50, y)
              .text(description, 150, y)
              .text(unitCost, 280, y, { width: 90, align: "right" })
              .text(quantity, 370, y, { width: 90, align: "right" })
              .text(lineTotal, 0, y, { align: "right" });
          }

          function generateHr(doc, y) {
            doc
              .strokeColor("#aaaaaa")
              .lineWidth(1)
              .moveTo(50, y)
              .lineTo(550, y)
              .stroke();
          }

          function formatCurrency(cents) {
            return "INR" + (cents / 100).toFixed(2);
          }

          function formatDate(date) {
            const day = date.getDate();
            const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            let month = months[dateObj.getUTCMonth()];
            const year = date.getFullYear();

            return day + "/" + month + "/" + year;
          }




          const invoice = {
  shipping: {
    name: orderItem.buyerName,
    address: orderItem.buyerAddline1,
    address2: orderItem.buyerAddline2,
    city: orderItem.buyerCity,
    state: orderItem.buyerState,
    country: orderItem.buyerCountry,
    postal_code: orderItem.buyerZipcode
  },
  items: [
    {
      item: orderItem.name,
      description: orderItem.name,
      quantity: orderItem.qty,
      amount: orderItem.amount * 100
    },
  ],
  subtotal: orderItem.amount * 100,
  invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");

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
  to: orderItem.buyerEmail,
  cc: orderItem.sellerEmail,
  bcc: process.env.USER_EMAIL,
  subject: 'Craftkaar order details',
  text: 'Thank you for shopping with us. Please find the bill in the attachments.',
  attachments: [
    {filename: 'invoice.pdf', path: './invoice.pdf'}
  ]
};

transporter.sendMail(mailOptions, function(err, info){
  if(err){
  } else {

  }
});



         }
       );
      });

      req.session.cart = null;
    } else{
      Buyer.findById(req.user._id).populate("orders").populate("cart").exec(function(err, user){
        let rE = user.cart.length - 1;
        let yT = user.orders.length;
        user.cart.forEach((item, i) => {
          let tY = new Order({items: item.id, id: item.id, name: item.name, qty: item.qty, price: item.price, image: item.image, amount: item.qty * item.price, sellerEmail: item.sellerEmail, sellerName: item.sellerName, sellerMobile: item.sellerMobile,
          sellerAddline1: item.sellerAddline1,
          sellerAddline2: item.sellerAddline2,
          sellerCity: item.sellerCity,
          sellerZipcode: item.sellerZipcode,
          sellerState: item.sellerState,
          sellerCountry: item.sellerCountry,
          buyerEmail: item.buyerEmail,
          buyerName: item.buyerName,
          buyerMobile: item.buyerMobile,
          buyerAddline1: item.buyerAddline1,
          buyerAddline2: item.buyerAddline2,
          buyerCity: item.buyerCity,
          buyerZipcode: item.buyerZipcode,
          buyerState: item.buyerState,
          buyerCountry: item.buyerCountry,
          paymentId: req.body.razorpay_payment_id});
          Order.create(tY, function(err, orderItem){
          user.orders.id = item.id;
          user.orders.name = item.name;
          user.orders.qty = item.qty;
          user.orders.image = item.image;
          user.orders.price = item.price;
          user.orders.amount = item.qty * item.price;
          user.orders.sellerEmail = item.sellerEmail;
          user.orders.sellerName = item.sellerName;
          user.orders.sellerMobile = item.sellerMobile;
          user.orders.sellerAddline1 = item.sellerAddline1;
          user.orders.sellerAddline2 = item.sellerAddline2;
          user.orders.sellerCity = item.sellerCity;
          user.orders.sellerZipcode = item.sellerZipcode;
          user.orders.sellerState = item.sellerState;
          user.orders.sellerCountry = item.sellerCountry;
          user.orders.buyerEmail = item.buyerEmail;
          user.orders.buyerName = item.buyerName;
          user.orders.buyerMobile = item.buyerMobile;
          user.orders.buyerAddline1 = item.buyerAddline1;
          user.orders.buyerAddline2 = item.buyerAddline2;
          user.orders.buyerCity = item.buyerCity;
          user.orders.buyerZipcode = item.buyerZipcode;
          user.orders.buyerState = item.buyerState;
          user.orders.buyerCountry = item.buyerCountry;
          user.orders.paymentId = req.body.razorpay_payment_id;
          user.orders.push(orderItem);


          function createInvoice(invoice, path) {
            let doc = new PDFDocument({ size: "A4", margin: 50 });

            generateHeader(doc);
            generateCustomerInformation(doc, invoice);
            generateInvoiceTable(doc, invoice);
            generateFooter(doc);

            doc.end();
            doc.pipe(fs.createWriteStream(path));
          }


          function generateHeader(doc) {
            doc
              .image("../main/public/images/craftkaa.png", 50, 45, { width: 70 })
              .fillColor("#444444")
              .fontSize(20)
              .text("", 110, 57)
              .fontSize(10)
              .text(user.orders.sellerEmail, 200, 50, { align: "right" })
              .text(user.orders.sellerAddline1, 200, 65, { align: "right" })
              .text(user.orders.sellerAddline2, 200, 80, { align: "right" })
              .text(user.orders.sellerCity, 200, 95, { align: "right" })
              .text(user.orders.sellerZipcode, 200, 110, { align: "right" })
              .text(user.orders.sellerState, 200, 125, { align: "right" })
              .text(user.orders.sellerCountry, 200, 140, { align: "right" })
              .moveDown();
          }



          function generateCustomerInformation(doc, invoice) {
            doc
              .fillColor("#444444")
              .fontSize(20)
              .text("Invoice", 50, 160);

            generateHr(doc, 185);

            const customerInformationTop = 200;

            doc
              .fontSize(10)
              .text("Invoice Number:", 50, customerInformationTop)
              .font("Helvetica-Bold")
              .text(invoice.invoice_nr, 150, customerInformationTop)
              .font("Helvetica")
              .text("Invoice Date:", 50, customerInformationTop + 15)
              .text(formatDate(new Date()), 150, customerInformationTop + 15)
              .text("GST:", 50, customerInformationTop + 30)
              .text("GSTNUMBER", 150, customerInformationTop + 30)

              .font("Helvetica-Bold")
              .text(invoice.shipping.name, 300, customerInformationTop)
              .font("Helvetica")
              .text(invoice.shipping.address + ", " + invoice.shipping.address2, 300, customerInformationTop + 15)
              .text(
                invoice.shipping.city +
                  ", " +
                  invoice.shipping.state +
                  ", " +
                  invoice.shipping.country + ", " + invoice.shipping.postal_code,
                300,
                customerInformationTop + 30
              )
              .moveDown();

            generateHr(doc, 252);
          }

          function generateInvoiceTable(doc, invoice) {
            let i;
            const invoiceTableTop = 330;

            doc.font("Helvetica-Bold");
            generateTableRow(
              doc,
              invoiceTableTop,
              "Item",
              "Description",
              "Unit Cost",
              "Quantity",
              "Line Total"
            );
            generateHr(doc, invoiceTableTop + 20);
            doc.font("Helvetica");

            for (i = 0; i < invoice.items.length; i++) {
              const item = invoice.items[i];
              const position = invoiceTableTop + (i + 1) * 30;
              generateTableRow(
                doc,
                position,
                item.item,
                item.description,
                formatCurrency(item.amount / item.quantity),
                item.quantity,
                formatCurrency(item.amount)
              );

              generateHr(doc, position + 20);
            }

            const subtotalPosition = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
              doc,
              subtotalPosition,
              "",
              "",
              "Subtotal",
              "",
              formatCurrency(invoice.subtotal)
            );

            const paidToDatePosition = subtotalPosition + 20;
            generateTableRow(
              doc,
              paidToDatePosition,
              "",
              "",
              "",
              "",
            );

            const duePosition = paidToDatePosition + 25;
            doc.font("Helvetica-Bold");
            generateTableRow(
              doc,
              duePosition,
              "",
              "",
              "",
              "",
            );
            doc.font("Helvetica");
          }

          function generateFooter(doc) {
            doc
              .fontSize(10)
              .text(
                "Thank you for your business.",
                50,
                780,
                { align: "center", width: 500 }
              );
          }

          function generateTableRow(
            doc,
            y,
            item,
            description,
            unitCost,
            quantity,
            lineTotal
          ) {
            doc
              .fontSize(10)
              .text(item, 50, y)
              .text(description, 150, y)
              .text(unitCost, 280, y, { width: 90, align: "right" })
              .text(quantity, 370, y, { width: 90, align: "right" })
              .text(lineTotal, 0, y, { align: "right" });
          }

          function generateHr(doc, y) {
            doc
              .strokeColor("#aaaaaa")
              .lineWidth(1)
              .moveTo(50, y)
              .lineTo(550, y)
              .stroke();
          }

          function formatCurrency(cents) {
            return "INR" + (cents / 100).toFixed(2);
          }

          function formatDate(date) {
            const day = date.getDate();
            const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
            let month = months[dateObj.getUTCMonth()];
            const year = date.getFullYear();

            return day + "/" + month + "/" + year;
          }




          const invoice = {
  shipping: {
    name: user.orders.buyerName,
    address: user.orders.buyerAddline1,
    address2: user.orders.buyerAddline2,
    city: user.orders.buyerCity,
    state: user.orders.buyerState,
    country: user.orders.buyerCountry,
    postal_code: user.orders.buyerZipcode
  },
  items: [
    {
      item: user.orders.name,
      description: user.orders.name,
      quantity: user.orders.qty,
      amount: user.orders.amount * 100
    },
  ],
  subtotal: user.orders.amount * 100,
  invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");


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
  to: user.orders.buyerEmail,
  cc: user.orders.sellerEmail,
  bcc: process.env.USER_EMAIL,
  subject: 'Craftkaar order details',
  text: 'Thank you for shopping with us. Please find the bill in the attachments.',
  attachments: [
    {filename: 'invoice.pdf', path: './invoice.pdf'}
  ]
};

transporter.sendMail(mailOptions, function(err, info){
  if(err){
  } else {
  }
});


          if(i === rE){user.save();}
           }
         );
        });
        user.cart.splice(0, rE+1);




    });
    }
  }
   res.send(response);
});




router.get("/", function(req, res) {
  Item.find({}, function(err, item) {
    if (err) {
    } else {
      res.render("landing", {
        item: item
      });
    }});
});



//auth routes
router.get("/signup", function(req, res) {
  res.render("signup");
});


router.post("/signup", function(req, res) {
  let newBuyer = new Buyer({
    username: req.body.username,
    name: req.body.name,
    mobile: req.body.mobile,
    addline1: req.body.addline1,
    addline2: req.body.addline2,
    city: req.body.city,
    zipcode: req.body.zipcode,
    state: req.body.state,
    country: req.body.country
  });
  Buyer.register(newBuyer, req.body.password, function(err, seller) {
    if (err) {
      return res.render("signup");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect("/items");
    });
  });
});


//show signin form
router.get("/signin", function(req, res) {
  res.render("signin");
});

router.post("/signin", passport.authenticate("local", {
  successRedirect: "/items",
  failureRedirect: "/signin"
}), function(req, res) {});


router.get("/forgot", function(req, res){
  res.render("forgot");
});

router.post("/forgot", function(req, res, next){
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf){
        let token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      Buyer.findOne({username: req.body.username}, function(err, user){
        if(!user){
          req.flash('error', "no account with that username exists.");
          return res.redirect('/forgot');
        } else {
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        user.save(function(err){
          done(err, token, user);
        });}
      });
    },
    function(token, user, done) {
      let smtpTransport = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASSWORD
        }
      });
      let mailOptions = {
        to: user.username,
        bcc: process.env.USER_EMAIL,
        from: process.env.USER_EMAIL,
        subject: 'Password reset',
        text: "You are receiving this because you have requested the reset of the password" +
        "Please click on the following link or paste this into your browser to complete the process " +
        "http://" + req.headers.host + "/reset/" + token + "\n\n" +
        "if you did not request this, please ignore this and your password will be unchanged"
      };
      smtpTransport.sendMail(mailOptions, function(err){
        req.flash('success', 'An email has been sent to' + user.username + 'with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err){
    if (err) return next(err);
    res.redirect('forgot');
  });
});


router.get("/reset/:token", function(req, res){
  Buyer.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
    if(!user){
      req.flash('error', "password reset token is invalid or has expired.");
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});


router.post('/reset/:token', function(req, res){
  async.waterfall([
    function(done){
      Buyer.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
        if(!user){
          req.flash('error', 'password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm){
          user.setPassword(req.body.password, function(err){
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function(err){
              req.logIn(user, function(err){
                done(err, user);
              });
            });
          });
        } else {
          req.flash("error", "passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function(user, done){
      let smtpTransport = nodemailer.createTransport({
        host: "smtpout.secureserver.net",
        secure: false,
        auth: {
          user: process.env.USER_EMAIL,
          password: process.env.USER_PASSWORD
        }
      });
      let mailOptions = {
        to: user.username,
        bcc: process.env.USER_EMAIL,
        from: process.env.USER_EMAIL,
        subject: 'Your password has been changed',
        text: 'Hello, \n\n' +
        'This is the confirmation that the password for your account' + user.username + 'has just changed.'
      };
      smtpTransport.sendMail(mailOptions, function(err){
        req.flash('success', 'Success!, your password has been changed.');
        done(err);
      });
    }
  ], function(err){
    res.redirect('/');
  });
});


router.get("/signout", function(req, res) {
  req.logout();
  res.redirect("/items");
});


router.get("/add-to-cart/:id", isLoggedIn, function(req, res) {
  Buyer.findOne(req.user._id).populate("cart").exec(function(err, gotBuyer){
    if(err){
    } else {
      Item.findById(req.params.id, function(err, gotItem){
        if(err){
        } else {

const cart = gotBuyer.cart.find(cart => cart.id === req.params.id);

if(cart !== undefined && cart.id === req.params.id){
  cart.qty++;
  cart.amount = cart.price * cart.qty;
  cart.save();
  res.redirect('/cart');

} else {
    let kuchItem = new Cart({items: req.params.id, id: req.params.id, name: gotItem.name, image: gotItem.image, price: gotItem.price, amount: gotItem.price, sellerEmail: gotItem.seller, sellerName: gotItem.sellerName, sellerMobile: gotItem.sellerMobile,
    sellerAddline1: gotItem.sellerAddline1,
    sellerAddline2: gotItem.sellerAddline2,
    sellerCity: gotItem.sellerCity,
    sellerZipcode: gotItem.sellerZipcode,
    sellerState: gotItem.sellerState,
    sellerCountry: gotItem.sellerCountry,
    buyerEmail: gotBuyer.username,
    buyerName: gotBuyer.name,
    buyerMobile: gotBuyer.mobile,
    buyerAddline1: gotBuyer.addline1,
    buyerAddline2: gotBuyer.addline2,
    buyerCity: gotBuyer.city,
    buyerZipcode: gotBuyer.zipcode,
    buyerState: gotBuyer.state,
    buyerCountry: gotBuyer.country});
          Cart.create(kuchItem, function(err, cartItem){
          gotBuyer.cart.id = req.params.id;
          gotBuyer.cart.name = gotItem.name;
          gotBuyer.cart.image = gotItem.image;
          gotBuyer.cart.price = gotItem.price;
          gotBuyer.cart.amount = gotBuyer.cart.price * gotBuyer.cart.qty;
          gotBuyer.cart.sellerEmail = gotItem.sellerEmail;
          gotBuyer.cart.sellerName = gotItem.sellerName;
          gotBuyer.cart.sellerMobile = gotItem.sellerMobile;
          gotBuyer.cart.sellerAddline1 = gotItem.sellerAddline1;
          gotBuyer.cart.sellerAddline2 = gotItem.sellerAddline2;
          gotBuyer.cart.sellerCity = gotItem.sellerCity;
          gotBuyer.cart.sellerZipcode = gotItem.sellerZipcode;
          gotBuyer.cart.sellerState = gotItem.sellerState;
          gotBuyer.cart.sellerCountry = gotItem.sellerCountry;
          gotBuyer.cart.buyerEmail = gotBuyer.username;
          gotBuyer.cart.buyerName = gotBuyer.name;
          gotBuyer.cart.buyerMobile = gotBuyer.mobile;
          gotBuyer.cart.buyerAddline1 = gotBuyer.addline1;
          gotBuyer.cart.buyerAddline2 = gotBuyer.addline2;
          gotBuyer.cart.buyerCity = gotBuyer.city;
          gotBuyer.cart.buyerZipcode = gotBuyer.zipcode;
          gotBuyer.cart.buyerState = gotBuyer.state;
          gotBuyer.cart.buyerCountry = gotBuyer.country;
          gotBuyer.save();
          gotBuyer.cart.push(cartItem);
          }
        );
        res.redirect('/cart');
        }
      }
    });
  }});});


router.get("/lessen/:id", function(req, res, next){
    Buyer.findOne(req.user._id).populate("cart").exec(function(err, gotBuyer){
      if(err){
      } else {
        const cart = gotBuyer.cart.find(cart => cart.id === req.params.id);
        if(cart !== undefined && cart.id === req.params.id){
          cart.qty--;
          cart.amount = cart.price * cart.qty;
          if(cart.qty === 0 || cart.qty < 0){
            Cart.findByIdAndRemove(cart._id, function(err, resp){
              if(err){
                res.redirect("back");
              } else {
              }
            });
          }
          cart.save();
          res.redirect('/cart');
        }
      }
    });
});


router.get("/add/:id", function(req, res, next){
    Buyer.findOne(req.user._id).populate("cart").exec(function(err, gotBuyer){
      if(err){
      } else {
        const cart = gotBuyer.cart.find(cart => cart.id === req.params.id);
        if(cart !== undefined && cart.id === req.params.id){
          cart.qty++;
          cart.amount = cart.price * cart.qty;
          cart.save();
          res.redirect('/cart');
        }
      }
    });
});


router.get("/reduce/:id", function(req, res, next){
  let productId = req.params.id;
  let cart = new TCart(req.session.cart ? req.session.cart : {});
  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect("/tcart");
});


router.get("/delete/:id", function(req, res, next){
  let productId = req.params.id;
  let cart = new TCart(req.session.cart ? req.session.cart : {});
  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect("/tcart");
});


router.get("/cart", function(req, res){
  if(req.user){
  Buyer.findOne(req.user._id).populate("cart").exec(function(err, items){
    if(err){
    } else {
      let total = items.cart.reduce( (ac, cv) => ac + cv.amount, 0 );
      items.cartTotal = total;
      items.save();
      res.render("shop/cart", {products: items, total: total});
    }});} else {
      res.redirect("/tcart");
    }
});


router.get("/cashd", function(req, res){
  if(req.session.cart){
    let cart = new TCart(req.session.cart);
    let user = req.session.cartBuyer;
    let rE = cart.generateArray().length - 1;
    cart.generateArray().forEach(function(item, i){

      let tY = new Torder({items: item.item._id, id: item.item._id, name: item.item.name, qty: item.qty, price: item.item.price, image: item.item.image, amount: item.item.price * item.qty, sellerEmail: item.item.seller, sellerName: item.item.sellerName, sellerMobile: item.item.sellerMobile, buyerEmail: user.username, buyerName: user.name, buyerMobile: user.mobile, buyerAddline1: user.addline1, buyerAddline2: user.addline2, buyerCity: user.city, buyerZipcode: user.zipcode, buyerState: user.state, buyerCountry: user.country, sellerAddline1: item.item.sellerAddline1, sellerAddline2: item.item.sellerAddline2, sellerCity: item.item.sellerCity,
      sellerZipcode: item.item.sellerZipcode,
      sellerState: item.item.sellerState,
      sellerCountry: item.item.sellerCountry, paymentId: "cashondelivery"});
      Torder.create(tY, function(err, orderItem){

        function createInvoice(invoice, path) {
          let doc = new PDFDocument({ size: "A4", margin: 50 });

          generateHeader(doc);
          generateCustomerInformation(doc, invoice);
          generateInvoiceTable(doc, invoice);
          generateFooter(doc);

          doc.end();
          doc.pipe(fs.createWriteStream(path));
        }


        function generateHeader(doc) {
          doc
            .image("../main/public/images/craftkaa.png", 50, 45, { width: 70 })
            .fillColor("#444444")
            .fontSize(20)
            .text("", 110, 57)
            .fontSize(10)
            .text(orderItem.sellerEmail, 200, 50, { align: "right" })
            .text(orderItem.sellerAddline1, 200, 65, { align: "right" })
            .text(orderItem.sellerAddline2, 200, 80, { align: "right" })
            .text(orderItem.sellerCity, 200, 95, { align: "right" })
            .text(orderItem.sellerZipcode, 200, 110, { align: "right" })
            .text(orderItem.sellerState, 200, 125, { align: "right" })
            .text(orderItem.sellerCountry, 200, 140, { align: "right" })
            .moveDown();
        }

        function generateCustomerInformation(doc, invoice) {
          doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Invoice", 50, 160);

          generateHr(doc, 185);

          const customerInformationTop = 200;

          doc
            .fontSize(10)
            .text("Invoice Number:", 50, customerInformationTop)
            .font("Helvetica-Bold")
            .text(invoice.invoice_nr, 150, customerInformationTop)
            .font("Helvetica")
            .text("Invoice Date:", 50, customerInformationTop + 15)
            .text(formatDate(new Date()), 150, customerInformationTop + 15)
            .text("GST:", 50, customerInformationTop + 30)
            .text("", 150, customerInformationTop + 30)

            .font("Helvetica-Bold")
            .text(invoice.shipping.name, 300, customerInformationTop)
            .font("Helvetica")
            .text(invoice.shipping.address + ", " + invoice.shipping.address2, 300, customerInformationTop + 15)
            .text(
              invoice.shipping.city +
                ", " +
                invoice.shipping.state +
                ", " +
                invoice.shipping.country + ", " + invoice.shipping.postal_code,
              300,
              customerInformationTop + 30
            )
            .moveDown();

          generateHr(doc, 252);
        }

        function generateInvoiceTable(doc, invoice) {
          let i;
          const invoiceTableTop = 330;

          doc.font("Helvetica-Bold");
          generateTableRow(
            doc,
            invoiceTableTop,
            "Item",
            "Description",
            "Unit Cost",
            "Quantity",
            "Line Total"
          );
          generateHr(doc, invoiceTableTop + 20);
          doc.font("Helvetica");

          for (i = 0; i < invoice.items.length; i++) {
            const item = invoice.items[i];
            const position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
              doc,
              position,
              item.item,
              item.description,
              formatCurrency(item.amount / item.quantity),
              item.quantity,
              formatCurrency(item.amount)
            );

            generateHr(doc, position + 20);
          }

          const subtotalPosition = invoiceTableTop + (i + 1) * 30;
          generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            "Subtotal",
            "",
            formatCurrency(invoice.subtotal)
          );

          const paidToDatePosition = subtotalPosition + 20;
          generateTableRow(
            doc,
            paidToDatePosition,
            "",
            "",
            "",
            "",
          );

          const duePosition = paidToDatePosition + 25;
          doc.font("Helvetica-Bold");
          generateTableRow(
            doc,
            duePosition,
            "",
            "",
            "",
            "",
          );
          doc.font("Helvetica");
        }

        function generateFooter(doc) {
          doc
            .fontSize(10)
            .text(
              "Thank you for your business.",
              50,
              780,
              { align: "center", width: 500 }
            );
        }

        function generateTableRow(
          doc,
          y,
          item,
          description,
          unitCost,
          quantity,
          lineTotal
        ) {
          doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 150, y)
            .text(unitCost, 280, y, { width: 90, align: "right" })
            .text(quantity, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
        }

        function generateHr(doc, y) {
          doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
        }

        function formatCurrency(cents) {
          return "INR" + (cents / 100).toFixed(2);
        }

        function formatDate(date) {
          const day = date.getDate();
          const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          let month = months[dateObj.getUTCMonth()];
          const year = date.getFullYear();

          return day + "/" + month + "/" + year;
        }




        const invoice = {
shipping: {
  name: orderItem.buyerName,
  address: orderItem.buyerAddline1,
  address2: orderItem.buyerAddline2,
  city: orderItem.buyerCity,
  state: orderItem.buyerState,
  country: orderItem.buyerCountry,
  postal_code: orderItem.buyerZipcode
},
items: [
  {
    item: orderItem.name,
    description: orderItem.name,
    quantity: orderItem.qty,
    amount: orderItem.amount * 100
  },
],
subtotal: orderItem.amount * 100,
invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");

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
to: orderItem.buyerEmail,
cc: orderItem.sellerEmail,
bcc: process.env.USER_EMAIL,
subject: 'Craftkaar order details',
text: 'Thank you for shopping with us. Please find the bill in the attachments.',
attachments: [
  {filename: 'invoice.pdf', path: './invoice.pdf'}
]
};

transporter.sendMail(mailOptions, function(err, info){
if(err){
} else {
}
});



       }
     );
    });

    req.session.cart = null;
  } else{
    Buyer.findById(req.user._id).populate("orders").populate("cart").exec(function(err, user){
      let rE = user.cart.length - 1;
      let yT = user.orders.length;
      user.cart.forEach((item, i) => {
        let tY = new Order({items: item.id, id: item.id, name: item.name, qty: item.qty, price: item.price, image: item.image, amount: item.qty * item.price, sellerEmail: item.sellerEmail, sellerName: item.sellerName, sellerMobile: item.sellerMobile,
        sellerAddline1: item.sellerAddline1,
        sellerAddline2: item.sellerAddline2,
        sellerCity: item.sellerCity,
        sellerZipcode: item.sellerZipcode,
        sellerState: item.sellerState,
        sellerCountry: item.sellerCountry,
        buyerEmail: item.buyerEmail,
        buyerName: item.buyerName,
        buyerMobile: item.buyerMobile,
        buyerAddline1: item.buyerAddline1,
        buyerAddline2: item.buyerAddline2,
        buyerCity: item.buyerCity,
        buyerZipcode: item.buyerZipcode,
        buyerState: item.buyerState,
        buyerCountry: item.buyerCountry,
        paymentId: "cashondelivery"});
        Order.create(tY, function(err, orderItem){
        user.orders.id = item.id;
        user.orders.name = item.name;
        user.orders.qty = item.qty;
        user.orders.image = item.image;
        user.orders.price = item.price;
        user.orders.amount = item.qty * item.price;
        user.orders.sellerEmail = item.sellerEmail;
        user.orders.sellerName = item.sellerName;
        user.orders.sellerMobile = item.sellerMobile;
        user.orders.sellerAddline1 = item.sellerAddline1;
        user.orders.sellerAddline2 = item.sellerAddline2;
        user.orders.sellerCity = item.sellerCity;
        user.orders.sellerZipcode = item.sellerZipcode;
        user.orders.sellerState = item.sellerState;
        user.orders.sellerCountry = item.sellerCountry;
        user.orders.buyerEmail = item.buyerEmail;
        user.orders.buyerName = item.buyerName;
        user.orders.buyerMobile = item.buyerMobile;
        user.orders.buyerAddline1 = item.buyerAddline1;
        user.orders.buyerAddline2 = item.buyerAddline2;
        user.orders.buyerCity = item.buyerCity;
        user.orders.buyerZipcode = item.buyerZipcode;
        user.orders.buyerState = item.buyerState;
        user.orders.buyerCountry = item.buyerCountry;
        user.orders.paymentId = "cashondelivery";
        user.orders.push(orderItem);


        function createInvoice(invoice, path) {
          let doc = new PDFDocument({ size: "A4", margin: 50 });

          generateHeader(doc);
          generateCustomerInformation(doc, invoice);
          generateInvoiceTable(doc, invoice);
          generateFooter(doc);

          doc.end();
          doc.pipe(fs.createWriteStream(path));
        }


        function generateHeader(doc) {
          doc
            .image("../main/public/images/craftkaa.png", 50, 45, { width: 70 })
            .fillColor("#444444")
            .fontSize(20)
            .text("", 110, 57)
            .fontSize(10)
            .text(user.orders.sellerEmail, 200, 50, { align: "right" })
            .text(user.orders.sellerAddline1, 200, 65, { align: "right" })
            .text(user.orders.sellerAddline2, 200, 80, { align: "right" })
            .text(user.orders.sellerCity, 200, 95, { align: "right" })
            .text(user.orders.sellerZipcode, 200, 110, { align: "right" })
            .text(user.orders.sellerState, 200, 125, { align: "right" })
            .text(user.orders.sellerCountry, 200, 140, { align: "right" })
            .moveDown();
        }



        function generateCustomerInformation(doc, invoice) {
          doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Invoice", 50, 160);

          generateHr(doc, 185);

          const customerInformationTop = 200;

          doc
            .fontSize(10)
            .text("Invoice Number:", 50, customerInformationTop)
            .font("Helvetica-Bold")
            .text(invoice.invoice_nr, 150, customerInformationTop)
            .font("Helvetica")
            .text("Invoice Date:", 50, customerInformationTop + 15)
            .text(formatDate(new Date()), 150, customerInformationTop + 15)
            .text("GST:", 50, customerInformationTop + 30)
            .text("GSTNUMBER", 150, customerInformationTop + 30)

            .font("Helvetica-Bold")
            .text(invoice.shipping.name, 300, customerInformationTop)
            .font("Helvetica")
            .text(invoice.shipping.address + ", " + invoice.shipping.address2, 300, customerInformationTop + 15)
            .text(
              invoice.shipping.city +
                ", " +
                invoice.shipping.state +
                ", " +
                invoice.shipping.country + ", " + invoice.shipping.postal_code,
              300,
              customerInformationTop + 30
            )
            .moveDown();

          generateHr(doc, 252);
        }

        function generateInvoiceTable(doc, invoice) {
          let i;
          const invoiceTableTop = 330;

          doc.font("Helvetica-Bold");
          generateTableRow(
            doc,
            invoiceTableTop,
            "Item",
            "Description",
            "Unit Cost",
            "Quantity",
            "Line Total"
          );
          generateHr(doc, invoiceTableTop + 20);
          doc.font("Helvetica");

          for (i = 0; i < invoice.items.length; i++) {
            const item = invoice.items[i];
            const position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
              doc,
              position,
              item.item,
              item.description,
              formatCurrency(item.amount / item.quantity),
              item.quantity,
              formatCurrency(item.amount)
            );

            generateHr(doc, position + 20);
          }

          const subtotalPosition = invoiceTableTop + (i + 1) * 30;
          generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            "Subtotal",
            "",
            formatCurrency(invoice.subtotal)
          );

          const paidToDatePosition = subtotalPosition + 20;
          generateTableRow(
            doc,
            paidToDatePosition,
            "",
            "",
            "",
            "",
          );

          const duePosition = paidToDatePosition + 25;
          doc.font("Helvetica-Bold");
          generateTableRow(
            doc,
            duePosition,
            "",
            "",
            "",
            "",
          );
          doc.font("Helvetica");
        }

        function generateFooter(doc) {
          doc
            .fontSize(10)
            .text(
              "Thank you for your business.",
              50,
              780,
              { align: "center", width: 500 }
            );
        }

        function generateTableRow(
          doc,
          y,
          item,
          description,
          unitCost,
          quantity,
          lineTotal
        ) {
          doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 150, y)
            .text(unitCost, 280, y, { width: 90, align: "right" })
            .text(quantity, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
        }

        function generateHr(doc, y) {
          doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
        }

        function formatCurrency(cents) {
          return "INR" + (cents / 100).toFixed(2);
        }

        function formatDate(date) {
          const day = date.getDate();
          const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          let month = months[dateObj.getUTCMonth()];
          const year = date.getFullYear();

          return day + "/" + month + "/" + year;
        }

        const invoice = {
shipping: {
  name: user.orders.buyerName,
  address: user.orders.buyerAddline1,
  address2: user.orders.buyerAddline2,
  city: user.orders.buyerCity,
  state: user.orders.buyerState,
  country: user.orders.buyerCountry,
  postal_code: user.orders.buyerZipcode
},
items: [
  {
    item: user.orders.name,
    description: user.orders.name,
    quantity: user.orders.qty,
    amount: user.orders.amount * 100
  },
],
subtotal: user.orders.amount * 100,
invoice_nr: 1234
};

createInvoice(invoice, "invoice.pdf");


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
to: user.orders.buyerEmail,
cc: user.orders.sellerEmail,
bcc: process.env.USER_EMAIL,
subject: 'Craftkaar order details',
text: 'Thank you for shopping with us. Please find the bill in the attachments.',
attachments: [
  {filename: 'invoice.pdf', path: './invoice.pdf'}
]
};

transporter.sendMail(mailOptions, function(err, info){
if(err){
} else {
}
});


        if(i === rE){user.save();}
         }
       );
      });
      user.cart.splice(0, rE+1);

  });
  }
  res.redirect("/success");
});


router.get("/success", function(req, res){
  res.render("payment/successd");
});


function checkUser(req, res, next){
  if(req.isAuthenticated()){
        if(req.params.id.equals(req.user._id)){
          next();
        } else {
          res.redirect("back");
        }
  } else {
    res.redirect("back");
  }
}



function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/signin");
}


function isLoggeIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else if (req.session.cart) {
    return next();
  }
  res.redirect("/signin");
}

module.exports = router;
