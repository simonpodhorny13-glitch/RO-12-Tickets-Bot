const Database = require("better-sqlite3");

const db = new Database("ro12.sqlite");

// Enable better safety
db.pragma("journal_mode = WAL");


// ===================== TABLE CREATION =====================

db.exec(`

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 250,
    firstSeen INTEGER,
    lastDaily INTEGER DEFAULT 0,
    dailyStreak INTEGER DEFAULT 0
);


CREATE TABLE IF NOT EXISTS voyages (
    id TEXT PRIMARY KEY,

    fromLocation TEXT,
    toLocation TEXT,

    length INTEGER,
    ship TEXT,

    date TEXT,
    time TEXT,

    basePrice INTEGER,

    status TEXT DEFAULT 'draft',
    salesOpen INTEGER DEFAULT 0,
    cancelled INTEGER DEFAULT 0,

    captain TEXT,
    fo TEXT,
    seniorCaptain TEXT,
    gc TEXT,

    gcDeadline INTEGER
);


CREATE TABLE IF NOT EXISTS bookings (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT,
    voyageId TEXT,

    type TEXT,
    location TEXT,

    paid INTEGER,

    bookedAt INTEGER
);


CREATE TABLE IF NOT EXISTS transactions (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT,

    type TEXT,

    amount INTEGER,

    timestamp INTEGER
);


CREATE TABLE IF NOT EXISTS settings (

    key TEXT PRIMARY KEY,
    value TEXT

);

`);


// ===================== USER FUNCTIONS =====================

function getUser(id) {

    let user = db
        .prepare(
            "SELECT * FROM users WHERE id = ?"
        )
        .get(id);


    if (!user) {

        db.prepare(`
            INSERT INTO users
            (id, balance, firstSeen)
            VALUES (?, ?, ?)
        `)
        .run(
            id,
            250,
            Date.now()
        );


        user = db
            .prepare(
                "SELECT * FROM users WHERE id = ?"
            )
            .get(id);
    }


    return user;
}


function updateBalance(id, amount) {

    db.prepare(`
        UPDATE users
        SET balance = balance + ?
        WHERE id = ?
    `)
    .run(
        amount,
        id
    );

}


// ===================== TRANSACTIONS =====================

function addTransaction(
    userId,
    type,
    amount
) {

    db.prepare(`
        INSERT INTO transactions
        (userId, type, amount, timestamp)
        VALUES (?, ?, ?, ?)
    `)
    .run(
        userId,
        type,
        amount,
        Date.now()
    );

}


// ===================== VOYAGES =====================

function getVoyage(id) {

    return db.prepare(`
        SELECT *
        FROM voyages
        WHERE id = ?
    `)
    .get(id);

}


function createVoyage(voyage) {

    db.prepare(`
        INSERT INTO voyages
        (
        id,
        fromLocation,
        toLocation,
        length,
        ship,
        date,
        time,
        basePrice
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
        voyage.id,
        voyage.from,
        voyage.to,
        voyage.length,
        voyage.ship,
        voyage.date,
        voyage.time,
        voyage.basePrice
    );

}


// ===================== BOOKINGS =====================

function addBooking(
    userId,
    voyageId,
    type,
    location,
    paid
){

    db.prepare(`
        INSERT INTO bookings
        (
        userId,
        voyageId,
        type,
        location,
        paid,
        bookedAt
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
        userId,
        voyageId,
        type,
        location,
        paid,
        Date.now()
    );

}



function getBooking(
    userId,
    voyageId
){

    return db.prepare(`
        SELECT *
        FROM bookings
        WHERE userId = ?
        AND voyageId = ?
    `)
    .get(
        userId,
        voyageId
    );

}



// ===================== EXPORT =====================

module.exports = {

    db,

    getUser,
    updateBalance,

    addTransaction,

    getVoyage,
    createVoyage,

    addBooking,
    getBooking

};
