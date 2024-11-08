import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import pg from "pg";
import axios from "axios";


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

//Get All Posts
app.get("/", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts");
    posts = data.rows;
    console.log(posts);
    res.render("index.ejs",{
        posts: posts,
    });
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
    let book = req.body.book;
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


    res.redirect("/");
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
    res.redirect("/");
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

    res.redirect("/");
});



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  