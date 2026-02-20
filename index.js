import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";
import session from "express-session";
import bcrypt from "bcrypt";
import postgres from 'postgres'


dotenv.config();

const app = express();
const port = process.env.PORT;

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
console.log("DB URL exists:", !!process.env.DATABASE_URL);
db.connect()
  .then(() => console.log("Connected to Supabase"))
  .catch(err => console.log("DB Connection Error:", err));


//middleware 

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// 1. Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_to_a_long_random_string',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

//set EJS as template engine
app.set("view engine","ejs")

//routes 

app.get("/", async (req,res)=>{

    try{
        // const result = await db.query("SELECT * FROM projects ORDER BY created_at DESC");
        // const book_result = await db.query("SELECT * FROM books ORDER BY created_at DESC")
        // const gallery_result = await db.query("SELECT * FROM gallery ORDER BY created_at DESC")
        // const skills_Result = await db.query("SELECT * FROM skills ORDER BY created_at DESC");

        const result = { rows: [] };
        const book_result = { rows: [] };
        const gallery_result = { rows: [] };
        const skills_Result = { rows: [] };

        res.render("index.ejs",{projects:result.rows, books:book_result.rows,gallery:gallery_result.rows, skills:skills_Result.rows});
    }catch(err){
        console.log(err);
        res.send("DatabseError")
    }
});

// 2. Authentication Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// 3. Login Routes
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                req.session.user = { id: user.id, username: user.username };
                return res.redirect('/admin');
            }
        }
        res.render('login', { error: 'Invalid credentials' });
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});
//admin page
app.get("/admin", isAuthenticated, async (req,res)=>{
        
    try{

    const result = await db.query("SELECT id, title FROM projects ORDER BY created_at DESC")
    const book_result = await db.query("SELECT book_id, title FROM books ORDER BY created_at DESC")
    const gallery_result = await db.query("SELECT * FROM gallery ORDER BY created_at DESC")
    const skills_Result = await db.query("SELECT * FROM skills ORDER BY created_at DESC");
    res.render("admin.ejs", {projects: result.rows, books: book_result.rows,gallery:gallery_result.rows,skills:skills_Result.rows});
    
    }catch(err){
        console.log(err);
        res.send("Error getting stored projects from db")
    }
});



app.post("/admin/add-project", isAuthenticated, async (req,res)=>{
    const {title,imageURL,description,projectLink} = req.body;

    try{

        await db.query(
            "INSERT INTO projects (title,img_url,description,project_link) VALUES ($1,$2,$3,$4)",
            [title,imageURL,description,projectLink]
        )

        res.redirect("/admin");

    }catch(err){
        console.log(err);
        res.send("error inserting project")
    }

   

})

//editing projects 
app.post("/admin/edit", isAuthenticated, async(req,res)=>{

    try{
    const projectID = req.body.projectID;
    const {title,imageURL,description,projectLink} = req.body;

    const result = await db.query("SELECT * FROM projects WHERE id = $1",[projectID]);
    const existing = result.rows[0];
    
    const updatedTitle = title || existing.title
    const updatedImage = imageURL || existing.img_url
    const updatedDescription = description || existing.description
    const updatedLink = projectLink || existing.project_link

    await db.query("UPDATE projects SET title = $1, img_url = $2, description = $3, project_link = $4 WHERE id = $5",
        [updatedTitle,updatedImage,updatedDescription,updatedLink,projectID]
    );

     res.redirect("/admin");

    }catch(err){
        console.log(err);
        res.send("error editing project")
    }

    
})





//deleting projects 
app.post("/admin/delete", isAuthenticated, async (req,res)=>{
    
    const projectID = req.body.projectID;


    try{
        await db.query("DELETE FROM projects WHERE id = $1",[projectID]);
        res.redirect("/admin");
    }catch(err){
        console.log("DELETE ERROR:", err);
        res.send("Error deleting your project");
    }

});

//adding books

app.post("/admin/add-book", isAuthenticated, async (req,res)=>{
    const {title,author,rating,my_thoughts,isbn} = req.body;

    try{

        await db.query(
            "INSERT INTO books (title,author,rating,my_thoughts,isbn) VALUES ($1,$2,$3,$4,$5)",
            [title,author,rating,my_thoughts,isbn]
        )

        res.redirect("/admin");

    }catch(err){
        console.log(err);
        res.send("error inserting book, Check: ISBN number cannot duplicate") 
    }

   

})

//editing books

//editing projects 
app.post("/admin/edit-book", isAuthenticated, async(req,res)=>{

    try{
    const book_id = req.body.book_id;
    const {title,author,rating,my_thoughts,isbn} = req.body;

    const book_result = await db.query("SELECT * FROM books WHERE book_id = $1",[book_id]);
    const existing = book_result.rows[0];
    
    const updatedTitle = title || existing.title
    const updatedAuthor = author || existing.author
    const updatedRating = rating || existing.rating
    const updatedMy_thoughts = my_thoughts || existing.my_thoughts
    const updatedIsbn = isbn|| existing.isbn

    await db.query("UPDATE books SET title = $1, author = $2, rating = $3, my_thoughts = $4, isbn = $5 WHERE book_id = $6",
        [updatedTitle,updatedAuthor,updatedRating,updatedMy_thoughts,updatedIsbn,book_id]
    );

     res.redirect("/admin");

    }catch(err){
        console.log(err);
        res.send("error editing book")
    }

    
})

//Deleting books 
app.post("/admin/delete-book", isAuthenticated, async (req,res)=>{
    
    const book_id = req.body.book_id;


    try{
        await db.query("DELETE FROM books WHERE book_id = $1",[book_id]);
        res.redirect("/admin");
    }catch(err){
        console.log("DELETE ERROR:", err);
        res.send("Error deleting your project");
    }

});

//adding an image to the gallery 

app.post("/admin/add-gallery", isAuthenticated, async (req, res) => {
    try {
        const { img_url, img_description } = req.body;

        await db.query(
            "INSERT INTO gallery (img_url, img_description) VALUES ($1, $2)",
            [img_url, img_description]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error adding image");
    }
});

//edit gallery 

app.post("/admin/edit-gallery", isAuthenticated, async (req, res) => {
    try {
        const { img_id, img_description } = req.body;

        await db.query(
            "UPDATE gallery SET img_description = $1 WHERE img_id = $2",
            [img_description, img_id]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error updating description");
    }
});

//delete image 
app.post("/admin/delete-gallery", isAuthenticated, async (req, res) => {
    try {
        const { img_id } = req.body;

        await db.query(
            "DELETE FROM gallery WHERE img_id = $1",
            [img_id]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error deleting image");
    }
});

//adding skills
app.post("/admin/add-skill", isAuthenticated, async (req, res) => {
    try {
        const { skill_name, skill_type } = req.body;

        await db.query(
            "INSERT INTO skills (skill_name, skill_type) VALUES ($1, $2)",
            [skill_name, skill_type]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error adding skill");
    }
});

app.post("/admin/edit-skill", isAuthenticated, async (req, res) => {
    try {
        const { skill_id, skill_name, skill_type } = req.body;

        const result = await db.query(
            "SELECT * FROM skills WHERE skill_id = $1",
            [skill_id]
        );

        const existing = result.rows[0];

        const updatedName = skill_name || existing.skill_name;
        const updatedType = skill_type || existing.skill_type;

        await db.query(
            "UPDATE skills SET skill_name = $1, skill_type = $2 WHERE skill_id = $3",
            [updatedName, updatedType, skill_id]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error editing skill");
    }
});

app.post("/admin/delete-skill", isAuthenticated, async (req, res) => {
    try {
        const { skill_id } = req.body;

        await db.query(
            "DELETE FROM skills WHERE skill_id = $1",
            [skill_id]
        );

        res.redirect("/admin");
    } catch (err) {
        console.log(err);
        res.send("Error deleting skill");
    }
});



//starting the server 
app.listen(port,()=>{
    console.log("Server running on port 3000");
})
