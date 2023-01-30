//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//Connect to Mongodb and create a db.
mongoose.set("strictQuery", false);

//Create todolistDB database
mongoose.connect("mongodb+srv://admin:23659129@cluster0.wqwwjuf.mongodb.net/todolistDB", {useNewUrlParser: true});
mongoose.connection.on("connected" , () => {
  console.log("Connected to DB successfully")
})
mongoose.connection.on("error" , (err) => {
  console.log("Error: ", err)
})

//Create schema
const itemsSchema = {
  name: String
};

//Create a model out of schema, name of model must be capatalized
//Later we will create documents using this model
const Item = mongoose.model("Item", itemsSchema);

//Create mongodb documents using the Item model
const item1 = new Item({
  name: "First item"
})

const item2 = new Item({
  name: "Second item"
})

const item3 = new Item({
  name: "Third item"
})

//Array of documents to be shown as default data to user
const defaultItems = [item1, item2, item3];


//New schema for multi list case
const ListSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", ListSchema);

//////////////////////Get requests///////////////////

app.get("/", function(req, res) {

  //Select all documents inside the Item collection 
  Item.find({}, (err, foundItems) => {
    if(foundItems.length === 0) {
      //  Insert the document array into the "Items" collection in db
      Item.insertMany(defaultItems, function(err){
        if(err) {
          console.log(err);
        }else {
          console.log("successfully inserted!");
        }

        res.redirect("/");
      });
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    } 
});
});


app.get("/about", function(req, res){
  res.render("about");
});

// Handles dynamic routes
app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  //findOne returns an object
  List.findOne({name: customListName}, (err, foundList) => {
    if(!err) {
      if(!foundList) {
        //Create new document using a new schema for the custom route
        const list = new List({
          name: customListName,
          items: defaultItems
        })

        // Save the list document into lists collection
        list.save()
        res.redirect("/" + customListName);
        
      }else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
})
////////////////Post requests////////////////////////
app.post("/", function(req, res){

  //Get the user eneterd text
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //Create a new document using the user enetered input
  const userItem = new Item({
    name: itemName
  });

  if(listName === "Today") {
    userItem.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(userItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
});

//We need to know the item id and the list to which the item blongs
//to be able to delete it
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  //Here we check if the item checked by user belongs to default
  //today list or to the custom list created by the user
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if(!err) {
        res.redirect("/");
      }
    })
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }
})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
