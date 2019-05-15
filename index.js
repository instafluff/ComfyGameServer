require("dotenv").config();

var PORT = process.env.PORT || 9001;
var express = require( 'express' );
var app = express();

// API Key Creation via Twitch Login!
// - CreateAPIKey
// - ResetAPIKey
// Game Stuff
// - CreateGame( APIKey, gameName )
// - UpdateGame()
// - DeleteGame( APIKey )

// Leaderboard Stuff
// - Createleaderboard( APIKey, gameName, leaderboardName )
// - UpdateLeaderboard()
// - GetScores( gameName, leaderboardName, pageId, [ startDate, endDate ] ): [scores], pageId
// - PostScore( APIKey, gameName, leaderboardName, username, score );
// - ClearAllScores( APIKey, gameName, leaderboardName )
// - FindScore( gameName, leaderboardName, name )
// - GetScoreByRank( gameName, leaderboardName )
// - GetScoresByTime( gameName, leaderboardName )

// Achievements Stuff
// - CreateAchievementsSet( APIKey, gameName )
// - GetAchievementsSet( gameName )
// - CreateAchievement( APIKey, gameName, achievementId )
// - PostAchievement( APIKey, gameName, achievementId, username )

app.get('/', function (req, res) {
  res.send('Hello World');
});

app.get("/games/:gameId", (req, res) => {
  db.get( `SELECT * FROM games WHERE gameId="${req.params.gameId}"`, ( err, row ) => {
    if( err ) { return res.status( 403 ).json( { error: err } ); }
    if( row ) { return res.json( row ); }
    return res.status( 403 ).json( { error: "Not Found" } );
  } );
});

app.get("/games/:gameId/scores/:leaderboardId", (req, res) => {
  db.get( `SELECT * FROM leaderboards WHERE gameId="${req.params.gameId}" AND leaderboardId="${req.params.leaderboardId}"`, ( err, row ) => {
    if( err ) { return res.status( 403 ).json( { error: err } ); }
    if( row ) { return res.json( row ); }
    return res.status( 403 ).json( { error: "Not Found" } );
  } );
});

app.get("/games/:gameId/scores/:leaderboardId/top", (req, res) => {
  db.get( `SELECT * FROM leaderboards WHERE gameId="${req.params.gameId}" AND leaderboardId="${req.params.leaderboardId}"`, ( err, row ) => {
    if( err ) { return res.status( 403 ).json( { error: err } ); }
    if( row ) {
      var isAsc = row.isAsc;
      db.all( `SELECT id,player,score,created FROM scores WHERE gameId="${req.params.gameId}" AND leaderboardId="${req.params.leaderboardId}" ORDER BY score ${isAsc > 0 ? "ASC" : "DESC"} LIMIT 100`, ( err, row ) => {
        if( err ) { return res.status( 403 ).json( { error: err } ); }
        return res.json( row );
      } );
      return;
    }
    return res.status( 403 ).json( { error: "Not Found" } );
  } );
});

app.listen( PORT );

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

db.serialize(function() {
  try {
    db.run( "CREATE TABLE IF NOT EXISTS games (id INTEGER PRIMARY KEY, gameId CHAR(32) UNIQUE NOT NULL, title TEXT NOT NULL, desc TEXT, created DATETIME, updated DATETIME)" );
    db.run( "CREATE TABLE IF NOT EXISTS leaderboards (id INTEGER PRIMARY KEY, gameId CHAR(32) NOT NULL, leaderboardId CHAR(32) NOT NULL, isAsc BOOLEAN NOT NULL, title TEXT NOT NULL, desc TEXT, created DATETIME, updated DATETIME, UNIQUE(gameId, leaderboardId))" );
    db.run( "CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, gameId CHAR(32) NOT NULL, leaderboardId CHAR(32) NOT NULL, player CHAR(100) NOT NULL, score NUMERIC NOT NULL, created DATETIME)" );
    //
    // var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    // for (var i = 0; i < 10; i++) {
    //     stmt.run("Ipsum " + i);
    // }
    // stmt.finalize();
    //
    // db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
    //     console.log(row.id + ": " + row.info);
    // });
    createGame( "testgame", "Test Game!", "This is a test game" );
    createGame( "testgame2", "Test Game 2!", "This is the #2 test game" );
    createLeaderboard( "testgame", "leaderboard1", "Test Leaderboard", "I wanna be the very best like no one ever was." );
    createLeaderboard( "testgame", "leaderboard2", "Test Leaderboard 2", "To catch them is my real test. To train them is my cause." );
    postScore( "testgame", "leaderboard1", "instafluff", 5.276 );
    postScore( "testgame", "leaderboard1", "instafluff1", 2.276 );
    postScore( "testgame", "leaderboard1", "instafluff2", 5.35 );
    postScore( "testgame", "leaderboard1", "instafluff3", -5.276 );
    // db.each( "SELECT * FROM games", ( err, row ) => {
    //   console.log( row );
    // } );
    // db.each( "SELECT * FROM leaderboards", ( err, row ) => {
    //   console.log( row );
    // } );
    // db.each( "SELECT * FROM scores ORDER BY score DESC", ( err, row ) => {
    //   console.log( row );
    // } );
  }
  catch( err ) {
    console.log( "ERROR:", err );
  }
});

function createGame( gameId, title, description = "" ) {
  try {
    db.run( `INSERT INTO games (gameId, title, desc, created, updated) VALUES ("${gameId.toLowerCase()}", "${title}", "${description}", DATETIME(), DATETIME())` );
  }
  catch( err ) {
    console.log( "Create Game Failed:", err );
  }
}

function createLeaderboard( gameId, leaderboardId, title, description, isAscending = false ) {
  try {
    db.run( `INSERT INTO leaderboards (gameId, leaderboardId, isAsc, title, desc, created, updated) VALUES ("${gameId.toLowerCase()}", "${leaderboardId.toLowerCase()}", ${isAscending}, "${title}", "${description}", DATETIME(), DATETIME())` );
  }
  catch( err ) {
    console.log( "Create Game Failed:", err );
  }
}

function postScore( gameId, leaderboardId, player, score ) {
  try {
    db.run( `INSERT INTO scores (gameId, leaderboardId, player, score, created) VALUES ("${gameId.toLowerCase()}", "${leaderboardId.toLowerCase()}", "${player}", ${score}, DATETIME())` );
  }
  catch( err ) {
    console.log( "Create Game Failed:", err );
  }
}

// db.close();
