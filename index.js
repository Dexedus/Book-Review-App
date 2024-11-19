import express, { response } from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import pg from "pg";
import axios from "axios";
import bcrypt from 'bcrypt';
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";


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


//Middleware for creating session
app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true, 
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//Passport module MUST go after session module.
app.use(passport.initialize());
app.use(passport.session());

let posts = [];
let userID = "";
let account = [];
let saltRounds = 10;

//Load reception page
app.get("/", async (req, res) =>{
    res.render("reception.ejs");
});

//Load the homepage
app.get("/home", async (req, res) =>{

if(req.isAuthenticated()){
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
} else {
res.redirect("/");
}
});

//Get all posts in order of ascending ID
app.get("/asc", async (req, res) =>{

if(req.isAuthenticated()){
    let data = await db.query("SELECT * FROM posts ORDER BY id ASC");
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    });
} else {
res.redirect("/");
}

});

// Get all posts in order of descending ID
app.get("/desc", async (req, res) =>{

    if(req.isAuthenticated()){
        let data = await db.query("SELECT * FROM posts ORDER BY id DESC");
        posts = data.rows
        console.log(posts)
        res.render("index.ejs",{
            posts: posts,
        });
    } else {
    res.redirect("/");
    }
});

// Load the new entry page
app.get("/add", async (req, res) =>{
if(req.isAuthenticated()){
    res.render("new.ejs",{
        header: "New Post",
    })
} else {
    res.redirect("/")
}
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


    res.redirect("/home");
});

//Load the update page
app.get("/update:id", async (req, res) =>{
if(req.isAuthenticated()){
    let id = req.params.id;
    let data = await db.query("SELECT * FROM posts WHERE id = ($1)",[id]);
    let posts = data.rows[0];
    res.render("new.ejs", {
        posts: posts,
        header: "Update Post",
    });
    console.log(posts);
} else {
    res.redirect("/")
}

});

//Update post
app.post("/edit:id", async (req, res) =>{
if(req.isAuthenticated()){
    let id = req.params.id;
    let author = req.body.author;
    let book = req.body.book;
    let review = req.body.review;
    let rating = req.body.rating;
    await db.query("UPDATE posts SET author = ($1), descr = ($2), rating = ($3), book_auth = ($4) WHERE id = ($5)", [author, review, rating, book, id]);
    res.redirect("/desc");
} else {
    res.redirect("/")
}
});

//Filter by author of Review
app.get("/author/:auth", async (req, res) =>{
if(req.isAuthenticated()){
    let author = req.params.auth;
    let data =  await db.query("SELECT * FROM posts WHERE author ILIKE ($1)", [author]);
    let posts = data.rows;
    console.log(author);
    res.render("index.ejs", {
        posts: posts,
    });
} else {
    res.redirect("/")
}
});

//Delete post
app.get("/delete:id", async (req, res) =>{
if(req.isAuthenticated()){
    let id = req.params.id;
    await db.query("DELETE FROM posts WHERE id = ($1)", [id]);

    res.redirect("/home");
} else {
    res.redirect("/")
}
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
app.post("/checkLogIn", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/failedPassword"
}));

//Wrong password
app.get("/failedPassword", async (req, res) =>{
    let account = [];
    res.render("LogSign.ejs", {
        header: "Wrong password. Try again",
        account: account,
    });
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

passport.use (new Strategy(async function verify (username, password, cb){
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
            return cb(err)
        } else {
            if(result){
                return cb(null, account)

        //If the passwords don't match, reload the log in page.
        } else {
            return cb(null, false)
        };
      };
    });

} else {
    return cb("user not found")
};

} catch (err) {
    return cb(err)
}
})
);

passport.serializeUser((account, cb) => {
    cb(null, account);
});

passport.deserializeUser((account, cb) => {
    cb(null, account);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  