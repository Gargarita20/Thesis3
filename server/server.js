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
    const db = Database("listcit-complete.db");
    db.pragma('journal_mode = WAL');

    const query = "SELECT Partner_Industry, Address, Deptmt, Link FROM Local" ;
    const stmt = db.prepare(query).all();

    db.close();

    return stmt;
}

function readIntDatabase(){
    const Database = require("better-sqlite3"); 
    const db = Database("listcit-complete.db");
    db.pragma('journal_mode = WAL');

    const query = "SELECT Industry, Address, Link FROM International";
    const stmt = db.prepare(query).all();

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
    {id: 4, company: "PEPA MILA PIZZA", country: "Italy", department: "Electronics"},
    ])
})

app.get('/api/records', (req, res) => {
    res.json(readDatabase());
})

app.get("/api/intRecords", (req, res) => {
    res.json(readIntDatabase());
})


app.listen(port, () => {
    console.log("Server running on port", port);
});