//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin_rajiv:test123@cluster0-dpbv6.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to TodoList"
});
const item2 = new Item({
  name: "Hit + to add the items"
});
const item3 = new Item({
  name: "<-- Check this to delete the items"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);




app.get("/", function(req, res) {

  Item.find({}, function(err, results) {

    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added default items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      });

    }


  })


});
app.get("/:customListName", function(req, res) { //route paramtre
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, docs) {
    if (err) {
      console.log(err);
    } else {
      if (!docs) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      } else {
        res.render("list", {
          listTitle: docs.name,
          newListItems: docs.items
        })
      }

    }
  })


});



app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName},function(err,docs){
      if(!err){
        docs.items.push(item);
        docs.save();
        res.redirect("/"+listName);
      }
    })
  }


});

app.post("/delete", function(req, res) {
  const checked = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checked, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("deleted");
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checked}}},function(err,docs){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }



});



app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server started successfully");
});
