import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import pg from "pg";
import axios from "axios";
import bcrypt from 'bcrypt';


const app = express();
const port = 3000;

//Databse
const db = new pg.Client({
    user: process.env.un,
    host: process.env.host,
    database: "bookstored",
    password: process.env.pw,
    port: 5432,
    ssl: true,
  });
  db.connect();

//Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let posts = [];
let userID = "";
let account = [];
let saltRounds = 10;

//Get All Posts
// app.get("/", async (req, res) =>{

//     let data = await db.query("SELECT * FROM posts");
//     posts = data.rows;
//     if(posts.length > 0){
//         res.render("index.ejs",{
//             posts: posts,
//         });
//     } else {
//         res.render("blank.ejs");
//     console.log(posts);
// }
// });


//Load reception page
app.get("/", async (req, res) =>{
    res.render("reception.ejs");
});

//Get all posts in order of ascending ID
app.get("/asc", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts ORDER BY id ASC");
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    });
});

// Get all posts in order of descending ID
app.get("/desc", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts ORDER BY id DESC");
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    });
});

// Load the new entry page
app.get("/add", async (req, res) =>{
    res.render("new.ejs",{
        header: "New Post",
    })
});

// Add entry to database
app.post("/submit", async (req, res) =>{
    let author = req.body.author.trim();
    let book = req.body.book.trim();
    let review = req.body.review;
    let rating = req.body.rating;

    const result = await axios.get(`https://openlibrary.org/search.json?q='%'||${book}||'%'&limit=1`);
    let coverID = result.data.docs[0].cover_edition_key;
    
    const fullDate = new Date()
    const day = fullDate.getDate()
    const month = fullDate.getMonth() + 1
    const year = fullDate.getFullYear()
    let date = `${day}/${month}/${year}`

    await db.query("INSERT INTO posts (author, date, descr, rating, book_auth, cover_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [author, date, review, rating, book, coverID] );


    res.redirect("/desc");
});

//Load the update page
app.get("/update:id", async (req, res) =>{
    let id = req.params.id;
    let data = await db.query("SELECT * FROM posts WHERE id = ($1)",[id]);
    let posts = data.rows[0];
    res.render("new.ejs", {
        posts: posts,
        header: "Update Post",
    });

    console.log(posts)
});

//Update post
app.post("/edit:id", async (req, res) =>{
    let id = req.params.id;
    let author = req.body.author;
    let book = req.body.book;
    let review = req.body.review;
    let rating = req.body.rating;
    await db.query("UPDATE posts SET author = ($1), descr = ($2), rating = ($3), book_auth = ($4) WHERE id = ($5)", [author, review, rating, book, id]);
    res.redirect("/desc");
})

//Filter by author of Review
app.get("/author/:auth", async (req, res) =>{
    let author = req.params.auth;
    let data =  await db.query("SELECT * FROM posts WHERE author ILIKE ($1)", [author]);
    let posts = data.rows;
    console.log(author);
    res.render("index.ejs", {
        posts: posts,
    });
});

//Delete post
app.get("/delete:id", async (req, res) =>{
    let id = req.params.id;
    await db.query("DELETE FROM posts WHERE id = ($1)", [id]);

    res.redirect("/desc");
});

//Click LogIn
app.get("/LogIn", async (req, res) =>{
    let account = [];
    res.render("LogSign.ejs", {
        header: "Please sign in",
        account: account,
    });
});

//Click SignUp
app.get("/SignUp", async (req, res) =>{
    res.render("LogSign.ejs",{
        header: "Sign up.",
    });
});

//Acceptlogin
app.post("/checkLogIn", async (req, res) =>{
    //user entered username/password
    let username = req.body.username;
    let password = req.body.password;

      try {
        //Find the account with the matching email
    let data = await db.query("SELECT * FROM users WHERE username = ($1)", [username]);

    //If account exists then get the hashed password and the userID
if (data.rows.length > 0){
    let account = data.rows[0]
    let hashedPassword = account.password;
    userID = account.id;

    //Compare the inputted password with the hashedpassword.
    bcrypt.compare(password, hashedPassword, async (err, result) =>{
        //if err, console.log it otherwise render the homepage.
        if(err){
            console.log(err)
        } else {
            if(result){
                let postData = await db.query("SELECT * FROM posts");
        posts = postData.rows;
        if(posts.length > 0){
            res.render("index.ejs",{
                posts: posts,
            });
            console.log(userID)
        } else {
            res.render("blank.ejs");
        console.log(posts);
        };

        //If the passwords don't match, reload the log in page.
        } else {
            res.render("LogSign.ejs",{
                header: "Incorrect password. Try again.",
                account: account,
            });
        };
      };
    });

} else {
    res.render("LogSign.ejs",{
        header: "User not found",
        account: account,
    })
};

} catch (err) {
    console.error(err);
    
}
});

//Add user to database
app.post("/addAccount", async (req, res) =>{
    let username = req.body.username;
    let password = req.body.password;
      try{
        //Check to see if the email already exists. If it does, return "Email already exists"
    const checkResult = await db.query("SELECT * FROM users WHERE username = ($1)", [username]);
    if(checkResult.rows.length > 0) {
        res.render("LogSign.ejs", {
            header: "Email already exists. Try logging in."
        })
    } else {
        //Password hashing
    bcrypt.hash(password, saltRounds, async (err, hash) =>{
        //If theres an error, log it. Otherwise, add the account       
        if (err) {
            console.log(err)
        } else {
        await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hash]);
    let account = [];
    res.render("LogSign.ejs", {
        header: "Please sign in.",
        account: account,
      });
    };
  });
};
} catch (err){
    console.log(err)
}
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  