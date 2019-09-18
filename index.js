require( "dotenv" ).config();

/*****************************************************************************
 * Imports
 *****************************************************************************/

const ComfyDB = require( "comfydb" );
const express = require( 'express' );
const cors = require( 'cors' );

/*****************************************************************************
 * Constants
 *****************************************************************************/

const PORT = process.env.PORT || 9001;

/**
 * API Key Creation via Twitch Login!
 * - CreateAPIKey
 * - ResetAPIKey
 *
 * Game Stuff
 * - CreateGame( APIKey, gameName )
 * - UpdateGame()
 * - DeleteGame( APIKey )
 *
 * Leaderboard Stuff
 * - Createleaderboard( APIKey, gameName, leaderboardName )
 * - UpdateLeaderboard()
 * - GetScores( gameName, leaderboardName, pageId, [ startDate, endDate ] ): [scores], pageId
 * - PostScore( APIKey, gameName, leaderboardName, username, score );
 * - ClearAllScores( APIKey, gameName, leaderboardName )
 * - FindScore( gameName, leaderboardName, name )
 * - GetScoreByRank( gameName, leaderboardName )
 * - GetScoresByTime( gameName, leaderboardName )
 *
 * Achievements Stuff
 * - CreateAchievementsSet( APIKey, gameName )
 * - GetAchievementsSet( gameName )
 * - CreateAchievement( APIKey, gameName, achievementId )
 * - PostAchievement( APIKey, gameName, achievementId, username )
 */

/*****************************************************************************
 * Express Router
 *****************************************************************************/

const app = express();
app.use( cors() );

app.get( '/', function ( req, res ) {
  res.send( 'Hello World' );
} );

app.get( "/games/:gameId", async ( req, res ) => {
  const { gameId } = req.params
  const game = await ComfyDB.Data.FindByKey( "games", gameId );
  return res.json( game );
} );

app.get( "/games/:gameId/scores/:leaderboardId", async ( req, res ) => {
  // TODO: Find and get leaderboard asc/desc setting
  const { gameId, leaderboardId } = req.params
  const scores = await ComfyDB.Data.Find(
    `scores/${ gameId }/${ leaderboardId }`,
    {
      sortBy: "score",
      isOrderDescending: true
    }
  );
  return res.json( scores );
} );

app.get( "/games/:gameId/scores/:leaderboardId/top", async ( req, res ) => {
  // TODO: Find and get leaderboard asc/desc setting
  const { gameId, leaderboardId } = req.games
  const scores = await ComfyDB.Data.Find(
    `scores/${ gameId }/${ leaderboardId }`,
    {
      sortBy: "score",
      count: 3,
      isOrderDescending: true
    }
  );
  return res.json( scores );
} );

app.get( "/games/:gameId/scores/:leaderboardId/:player/:score", async ( req, res ) => {
  const { gameId, leaderboardId, player, score } = req.params
  postScore( gameId, leaderboardId, player, parseFloat( score ) );
  return res.json( {} );
} );

app.get( "/games/:gameId/scores/:leaderboardId/delete", async ( req, res ) => {
  const { gameId, leaderboardId } = req.params
  clearLeaderboard( gameId, leaderboardId );
  return res.json( {} );
} );

/*****************************************************************************
 * Initialisation
 *****************************************************************************/

( async function Initialize() {
  await ComfyDB.Init();
  await ComfyDB.Collections.Create( "games" );
  // await ComfyDB.Collections.Create( "achievements" );
  await ComfyDB.Collections.Create( "leaderboards" );
  createGame( "penguindrop", "Penguin Drop", "!drop to try and land on the target for a high score!" );
  createGame( "testgame", "Test Game!", "This is a test game" );
  createGame( "testgame2", "Test Game 2!", "This is the #2 test game" );
  createLeaderboard( "penguindrop", "leaderboard", "Penguin Drop High Scores!", "Best Target Landing Evarrrrr" );
  createLeaderboard( "testgame", "leaderboard1", "Test Leaderboard", "I wanna be the very best like no one ever was." );
  createLeaderboard( "testgame", "leaderboard2", "Test Leaderboard 2", "To catch them is my real test. To train them is my cause." );
  postScore( "testgame", "leaderboard1", "instafluff", 5.276 );
  postScore( "testgame", "leaderboard1", "instafluff1", 2.276 );
  postScore( "testgame", "leaderboard1", "instafluff2", 5.35 );
  postScore( "testgame", "leaderboard1", "instafluff3", -5.276 );
  // clearLeaderboard( "testgame", "leaderboard1" );
  // postScore( "testgame", "leaderboard1", "instafluff3", -5.276 );

  app.listen( PORT );
} )().catch( errorCatcher );

async function createGame( gameId, title, description = "" ) {
  try {
    await ComfyDB.Data.SetByKey( "games", gameId, { gameId, title, description } );
  } catch( err ) {
    errorCatcher( err );
  }
}

async function createLeaderboard(
  gameId,
  leaderboardId,
  title,
  description,
  isAscending = false
) {
  try {
    // TODO: Check if game exists
    await ComfyDB.Data.SetByKey(
      "leaderboards",
      `${ gameId }/${ leaderboardId }`,
      { gameId, leaderboardId, title, description, isAscending }
    );
    await ComfyDB.Collections.Create( `scores/${ gameId }/${ leaderboardId }` );
  } catch( err ) {
    errorCatcher( err );
  }
}

async function clearLeaderboard( gameId, leaderboardId ) {
  try {
    // TODO: Check if game exists
    // TODO: Check if leaderboard exists
    await ComfyDB.Collections.Delete( `scores/${ gameId }/${ leaderboardId }` );
    await ComfyDB.Collections.Create( `scores/${ gameId }/${ leaderboardId }` );
  } catch( err ) {
    errorCatcher( err );
  }
}

async function postScore( gameId, leaderboardId, player, score ) {
  try {
    // TODO: Check if the game exists
    // TODO: Check if the leaderboard exists
    // TODO: Check if score is lower than before on ascending leaderboards
    // Check if score is higher than before
    const prevScore = await ComfyDB.Data.FindByKey( `scores/${ gameId }/${ leaderboardId }`, player );

    if( prevScore.length <= 0 ) {
      return await ComfyDB.Data.SetByKey(
        `scores/${ gameId }/${ leaderboardId }`,
        player,
        { gameId, leaderboardId, player, score }
      );
    } else if( prevScore[ 0 ].score < score ) {
      await ComfyDB.Data.SetByKey(
        `scores/${ gameId }/${ leaderboardId }`,
        player,
        { gameId, leaderboardId, player, score }
      );
    }
  } catch( err ) {
    errorCatcher( err );
  }
}

/*****************************************************************************
 * Utils
 *****************************************************************************/

function errorCatcher( err ) {
  console.log( "Create Game Failed:", err );
}
