const pool = require('../db')

// function Load data
const getData = async() => {
    try{
        const data = await pool.query(`SELECT * FROM public.contacts ORDER BY name ASC`)
        return data.rows
    }catch(err){
        console.log(err.message);
    }
};
// function Load data Detail
const getDataDetail = (name) => {
    try{
        return pool.query(`SELECT * FROM contacts WHERE name = '${name}'`)
    } catch(err){
        console.log(err.message);
    }
};

// function save Data
const saveData = async(name,email,mobile) => {
    try {
        const contact = {name,email,mobile};
        await pool.query(`INSERT INTO contacts values
            ('${name}','${mobile}','${email}')`)
    } catch (err) {
        console.log(err.message);
    }
}

//function update contact
const updateContact =(oldName,name,email,mobile) => {
    try {
        return pool.query(`UPDATE public.contacts
        SET name='${name}', mobile='${mobile}', email='${email}'
        WHERE name = '${oldName}'` )
    } catch (err) {
        console.log(err.message);
    }
};

// function delete Data
const deleteData = (name) => {
    try {
        return pool.query(`DELETE FROM public.contacts
        WHERE name = '${name}'`)        
    } catch (err) {
        console.log(err.message);
    }
}

// function duplikat (validator)
const cekDuplikat =async(name) => {
    try {
        return await pool.query(`SELECT LOWER(name) FROM public.contacts WHERE name = '${name.toLowerCase()}'`)
    } catch (err) {
        console.log(err.message);        
    }
};

module.exports={getData,saveData,updateContact,deleteData,cekDuplikat,getDataDetail}