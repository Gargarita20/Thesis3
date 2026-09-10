const express = require("express");
const app = express();
const cors = require("cors");

const port = 3000;
const front_port = 5173;

app.use(cors({
    origin: [`http://localhost:${front_port}`, `http://127.0.0.1:${front_port}`]
}));


function readDatabase(){
    const Database = require("better-sqlite3"); 
    // get() returns one row
    // all() returns all rows
    // const db = Database("partners.sqlite")
    const db = Database("listcit-complete.db");
    db.pragma('journal_mode = WAL');


    const query = "SELECT Partner_Industry, Address, Deptmt, Link FROM Local" ;
    const stmt = db.prepare(query).all();

    // console.log(stmt);
    // stmt.forEach((row) => {
    //     console.log(`Name: ${row.Partner_Industry} | Date Acquired: ${row.Date_Acquire} | Department: ${row.Deptmt}`)
    // });

    console.log(stmt); // json

    // console.log(` There has ${stmt.length} rows`);


    db.close();

    return stmt;
}


app.get('/', (req, res) => {
    res.send("Server Backend Testing");
})

app.get('/api/sample', (req, res) => {
    res.json([
    {id: 1, company: "MINISO", country: "Germany", department: "Food"},
    {id: 2, company: "EEHHY Comp", country: "South Korea", department: "Mech"},
    {id: 3, company: "JEEZ LUIZ", country: "Hapon", department: "Elec"},
    {id: 4, company: "PEPE MILA PIZZA", country: "Italy", department: "Electronics"},
    ])
})

app.get('/api/records', (req, res) => {
    res.json(readDatabase());
})


app.listen(port, () => {
    console.log("Server running on port", port);
});