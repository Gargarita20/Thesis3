const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const port = 3000;
const front_port = 5173;
const databasePath = path.join(__dirname, "listcit-complete.db");
const partnerLogoDirectory = path.resolve(__dirname, "../src/media/PARTNERS LOGO");

app.use(cors({
    origin: [`http://localhost:${front_port}`, `http://127.0.0.1:${front_port}`]
}));
app.use("/partner-logos", express.static(partnerLogoDirectory));

function openDatabase() {
    const db = new Database(databasePath);
    db.pragma("journal_mode = WAL");
    return db;
}

function normalizeName(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function listLogoPaths(directory = partnerLogoDirectory) {
    if (!fs.existsSync(directory)) return [];

    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return listLogoPaths(fullPath);
        if (!/\.(png|jpe?g|webp|svg)$/i.test(entry.name)) return [];
        return [path.relative(partnerLogoDirectory, fullPath).split(path.sep).join("/")];
    }).sort();
}

function findLogoPath(company, logoPaths) {
    const companyName = normalizeName(company);
    const companyTokens = new Set(companyName.split(" "));
    const matches = logoPaths.map((logoPath) => {
        const filename = path.basename(logoPath, path.extname(logoPath));
        const normalizedFilename = normalizeName(filename);
        const filenameTokens = normalizedFilename.split(" ");
        const exact = normalizedFilename === companyName;
        const contained = normalizedFilename.length >= 4 && companyName.includes(normalizedFilename);
        const tokenMatch = filenameTokens.length > 1
            ? filenameTokens.every((token) => companyTokens.has(token))
            : filenameTokens[0].length >= 3 && companyTokens.has(filenameTokens[0]);

        return exact || contained || tokenMatch
            ? { logoPath, exact, score: filenameTokens.length * 100 + normalizedFilename.length }
            : null;
    }).filter(Boolean);

    matches.sort((left, right) => Number(right.exact) - Number(left.exact) || right.score - left.score);
    return matches[0]?.logoPath ?? null;
}

function ensureLogoPaths() {
    const db = openDatabase();
    try {
        for (const table of ["Local", "International"]) {
            const columns = db.prepare(`PRAGMA table_info(${table})`).all();
            if (!columns.some((column) => column.name === "LogoPath")) {
                db.exec(`ALTER TABLE ${table} ADD COLUMN LogoPath TEXT`);
            }
        }

        const logoPaths = listLogoPaths();
        const localRows = db.prepare("SELECT ID, Partner_Industry FROM Local WHERE LogoPath IS NULL OR TRIM(LogoPath) = ''").all();
        const internationalRows = db.prepare("SELECT ID, Industry FROM International WHERE LogoPath IS NULL OR TRIM(LogoPath) = ''").all();
        const updateLocal = db.prepare("UPDATE Local SET LogoPath = ? WHERE ID = ?");
        const updateInternational = db.prepare("UPDATE International SET LogoPath = ? WHERE ID = ?");

        const backfill = db.transaction(() => {
            for (const row of localRows) {
                const logoPath = findLogoPath(row.Partner_Industry, logoPaths);
                if (logoPath) updateLocal.run(logoPath, row.ID);
            }
            for (const row of internationalRows) {
                const logoPath = findLogoPath(row.Industry, logoPaths);
                if (logoPath) updateInternational.run(logoPath, row.ID);
            }
        });
        backfill();
    } finally {
        db.close();
    }
}

function readDatabase() {
    const db = openDatabase();
    try {
        return db.prepare("SELECT Partner_Industry, Address, Deptmt, Link, Information, LogoPath FROM Local ORDER BY Partner_Industry").all();
    } finally {
        db.close();
    }
}

function readIntDatabase() {
    const db = openDatabase();
    try {
        return db.prepare("SELECT Industry, Address, Link, Information, LogoPath FROM International ORDER BY Industry").all();
    } finally {
        db.close();
    }
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


ensureLogoPaths();

app.listen(port, () => {
    console.log("Server running on port", port);
});