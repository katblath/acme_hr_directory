//setup
require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

const express = require("express");
const app = express();

//init it
const init = async () => {};
