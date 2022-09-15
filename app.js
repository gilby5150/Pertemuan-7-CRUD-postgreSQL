const express = require('express')
const app = express()
const port = 3000
const expressLayouts = require('express-ejs-layouts');
// call db
const pool = require('./db')
const fs = require("fs");
//validator
const { body, check, validationResult } = require('express-validator');
// storage messages
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const { resolve } = require('path');
const { rejects } = require('assert');
const morgan = require('morgan');
const {getData,saveData,updateContact,deleteData,cekDuplikat,getDataDetail} = require('./utils/function');

app.use(morgan('dev'));
// Konfigurasi flash
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(express.json()) // => req.body
app.use(express.urlencoded({ extended: true }));
// information using EJS
app.set('view engine','ejs');
// information using EJS-express layout
app.use(expressLayouts);

// URL Default
app.get('/',(req,res)=>{
    res.render('index',{name:"GILBY",title:"WebServer EJS",status:"home",navTitle:"Home Page"});
});

// URL contact
app.get('/contact', async(req,res)=>{
    const data =  await getData();
    res.render('contact'
    ,{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data,
        pesan: req.flash('pesan'),
        // layout: 'layout'
    });
})
// URL addAsync
app.get("/addasync", async(req,res)=>{
    try {
        const name = "gilbyF"
        const mobile = "085775245846"
        const email = "gilby@gmail.com"
        const newCont =  await pool.query(`INSERT INTO contacts values
        ('${name}','${mobile}','${email}') RETURNING *`)
        res.json(newCont)
    } catch (err) {
        console.log(err.message);
    }
})
// URL Addcontact
app.get('/contact/add/', async(req,res)=>{
    const data =  await getData();
    res.render('add'
    ,{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data
    });
})

// method post data(kirim)
app.post('/contact/addData',
[   
    // validator duplikat name
    body('name').custom(async(value)=>{
        const duplikat =  await cekDuplikat(value) ;
        if (duplikat) {
            throw new Error('Name has been taken, please use another name');
        }
        return true;
    }),
    // validator email
    check('email', 'Email doesnt valid!').isEmail(),
    // validator mobile
    check('mobile', 'Mobile doesnt valid!').isMobilePhone('id-ID'),
],
async(req, res) => {
    const errors = validationResult(req);
    const data = await getData();
    // jika ada error maka render file add
    if (!errors.isEmpty()) {
        res.render('add', {
            title: 'WebServer EJS',
            status:"contact",
            navTitle:"Contact Page",
            data: data,
            errors: errors.array()
        });
      } else {
        // jika tidak ada error maka tambahkan contact yang direquest dan alihkan ke route /contact
        saveData(req.body.name,req.body.email,req.body.mobile);
        req.flash('pesan', 'Data contact berhasil ditambahkan!');
        res.redirect('/contact');
    }
});

// URL Editcontact
app.get('/contact/edit/:name',async(req,res)=>{
    try{
        const data = await getDataDetail(req.params.name);
        res.render('edit',{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data.rows[0]
    });
    }catch(err){
        console.error(err.message);
    }
    
})

// URL About
app.get('/about',(req,res)=>{
    res.render('about',{title:"about page",status:"about",navTitle:"About Page"});
})

app.use('/public', express.static(path.join(__dirname, 'public')))

// URL Product/:id
app.get('/product/:id',(req,res)=>{
    res.send(`product id: ${req.params.id}<br>kategori: ${req.query.category}`);
})

// delete - using delete method
app.post('/contact/:name/delete', async(req, res) => {
    await deleteData(req.params.name);
    req.flash('pesan','Data has been deleted!')
    res.redirect("/contact")
})

// update - using update method
app.post('/contact/update',
[
    // validator duplikat name
    body('newName').custom(async(value, { req })=>{
        const duplikat = await cekDuplikat(value);
        console.log(duplikat);
        if (duplikat) {
            throw new Error('Name has been taken!');
        }
        return true;
    }),
     // validator email
     check('newEmail', 'Email doesnt valid!').isEmail(),
     // validator mobile
     check('newMobile', 'Mobile doesnt valid!').isMobilePhone('id-ID'),
],
async(req, res) => {
    const errors = validationResult(req);
    // jika ada error maka render file edit
    if (!errors.isEmpty()) {
        res.render('edit', {
          layout: 'layout',
          title: 'Form Edit Contact',
          errors: errors.array(),
          data: {oldName:req.body.oldName,name:req.body.newName,email:req.body.newEmail,mobile:req.body.newMobile},
          status:"contact",
          navTitle:"Contact Page",
        });
      } else {
        // jika tidak ada error maka tambahkan contact yang direquest dan alihkan ke route /contact
        await updateContact(req.body.oldName,req.body.newName,req.body.newEmail,req.body.newMobile);
        req.flash('pesan', 'Data contact berhasil diubah!');
        res.redirect('/contact');
    }
})

//default jika memasukan url yang tidak ada
app.use('/',(req,res)=>{
    res.status(404)
    res.send('<h1>PAGE NOT FOUND : 404</h1>');
})

// listen port
app.listen(port,() =>{
    console.log(`Example app listening on port${port}`);
})