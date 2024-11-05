import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config';
import pg from "pg";
import axios from "axios";


const app = express();
const port = 3000;

const db = new pg.Client({
    user: process.env.un,
    host: "localhost",
    database: "Bookstored",
    password: process.env.pw,
    port: 5432,
  });
  db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

let posts = []

app.get("/", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts")
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    })
})

app.get("/asc", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts ORDER BY id ASC")
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    })
})

app.get("/desc", async (req, res) =>{

    let data = await db.query("SELECT * FROM posts ORDER BY id DESC")
    posts = data.rows
    console.log(posts)
    res.render("index.ejs",{
        posts: posts,
    })
})

app.get("/add", async (req, res) =>{
    res.render("new.ejs")
})

app.post("/submit", async (req, res) =>{
    let author = req.body.author;
    let book = req.body.book;
    let review = req.body.review;
    let rating = req.body.rating;

    const result = await axios.get(`https://openlibrary.org/search.json?q=${book}&limit=1`)
    let coverID = result.data.docs[0].cover_edition_key;
    
    const fullDate = new Date()
    const day = fullDate.getDate()
    const month = fullDate.getMonth() + 1
    const year = fullDate.getFullYear()
    let date = `${day}/${month}/${year}`

    await db.query("INSERT INTO posts (author, date, descr, rating, book_auth, cover_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [author, date, review, rating, book, coverID] );


    res.redirect("/");
})

app.get("/update:id", (req, res) =>{
    let id = req.params.id;
    
})

app.get("/delete:id", async (req, res) =>{
    let id = req.params.id
    await db.query("DELETE FROM posts WHERE id = ($1)", [id])

    res.redirect("/")
})



app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  