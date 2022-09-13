const express = require('express')
const app = express()
const port = 3000
const expressLayouts = require('express-ejs-layouts');
// call db
const pool = require('./db')

// required data json
const data = './data/contact.json';
const fs = require("fs");
//validator
const { body, check, validationResult } = require('express-validator');
// storage messages
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');

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

app.use(express.json()) // => req.body

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
app.get('/contact',(req,res)=>{
    const data = getData();
    res.render('contact'
    ,{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data,
        pesan: req.flash('pesan')
    });
})

// URL Editcontact
app.get('/contact/edit/:name',(req,res)=>{
    const contacts = getData();
    const data = contacts.find((c)=> c.name.toLowerCase() === req.params.name.toLowerCase());
    res.render('edit'
    ,{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data
    });
})

// URL Addcontact
app.get('/contact/add/',(req,res)=>{
    res.render('add'
    ,{
        title: 'WebServer EJS',
        status:"contact",
        navTitle:"Contact Page",
        data: data
    });
})
// morgan
// app.use((req, res, next) => {
//     console.log('Time:', Date.now())
//     next()
//   });
const morgan = require('morgan');
app.use(morgan('dev'));
// URL About
app.get('/about',(req,res)=>{
    res.render('about',{title:"about page",status:"about",navTitle:"About Page"});
})
const path = require('path')
app.use('/public', express.static(path.join(__dirname, 'public')))

// URL Product/:id
app.get('/product/:id',(req,res)=>{
    res.send(`product id: ${req.params.id}<br>kategori: ${req.query.category}`);
})

// function save Data
const saveData = (name,email,mobile) => {
    const contact = {name,email,mobile};
    const contacts = getData();
    contacts.push(contact)
    const stringifyData = JSON.stringify(contacts)
    fs.writeFileSync(data, stringifyData)
}

// function Load data
const getData = () => {
    const jsonData = fs.readFileSync(data)
    return JSON.parse(jsonData)   
}

// fungsi untuk cek name jika duplikat
const cekDuplikat = (name) => {
    const contacts = getData();
    return contacts.find((contact) => contact.name === name);
  };

// function post data(kirim)
app.post('/contact/addData',
[   
    // validator duplikat name
    body('name').custom((value)=>{
        const duplikat = cekDuplikat(value);
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
(req, res) => {
    const errors = validationResult(req);
    // jika ada error maka render file add
    if (!errors.isEmpty()) {
        res.render('add', {
          isActive: 'contact',
          layout: 'layout',
          title: 'Form Tambah Contact',
          errors: errors.array(),
          data : data,
          status:"contact",
          navTitle:"Contact Page",
        });
      } else {
        // jika tidak ada error maka tambahkan contact yang direquest dan alihkan ke route /contact
        saveData(req.body.name,req.body.email,req.body.mobile);
        req.flash('pesan', 'Data contact berhasil ditambahkan!');
        res.redirect('/contact');
    }
});

// function delete Data
const deleteData = (name) => {
    const contacts = getData();
    const index = contacts.findIndex((c) => c.name === name);
    contacts.splice(index, 1);
        fs.writeFileSync(data,JSON.stringify(contacts));
}
// delete - using delete method
app.post('/contact/:name/delete', (req, res) => {
    deleteData(req.params.name);
    req.flash('pesan','Data has been deleted!')
    res.redirect("/contact")
})

//function update contact
const updateContact = (oldName,name,email,mobile) => {
    const contact = {name,email,mobile}
    deleteData(oldName)
    const newContacts = getData();
    newContacts.push(contact)
    fs.writeFileSync(data,JSON.stringify(newContacts));
};

// update - using update method
app.post('/contact/update',
[
    // validator duplikat name
    body('newName').custom((value, { req })=>{
        const duplikat = cekDuplikat(value);
        if (value !== req.body.oldName && duplikat) {
            throw new Error('Name has been taken!');
        }
        return true;
    }),
     // validator email
     check('newEmail', 'Email doesnt valid!').isEmail(),
     // validator mobile
     check('newMobile', 'Mobile doesnt valid!').isMobilePhone('id-ID'),
],
(req, res) => {
    const errors = validationResult(req);
    // jika ada error maka render file edit
    if (!errors.isEmpty()) {
        res.render('edit', {
          isActive: 'contact',
          layout: 'layout',
          title: 'Form Edit Contact',
          errors: errors.array(),
        //   data : data,
          data: {oldName: req.body.oldName,name:req.body.newName,email: req.body.newEmail, mobile: req.body.newMobile},
          status:"contact",
          navTitle:"Contact Page",
        });
      } else {
        // jika tidak ada error maka tambahkan contact yang direquest dan alihkan ke route /contact
        updateContact(req.body.oldName,req.body.newName,req.body.newEmail,req.body.newMobile);
        req.flash('pesan', 'Data contact berhasil diubah!');
        res.redirect('/contact');
    }
    // updateContact(req.body.oldName,req.body.newName,req.body.newEmail,req.body.newMobile);
    // res.redirect("/contact")
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