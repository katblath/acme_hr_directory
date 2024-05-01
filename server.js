//setup db connection
require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

// middleware esque things, define parsing and route logging
const express = require("express");
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));

//---------------------------------------create routes

//GET /api/employees ----------------------------(READ)----------------RUBRIC ITEM 1
app.get("/api/employees", async (req, res, next) => {
  try {
    const response = await client.query("SELECT * FROM employees");
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//GET /api/departments --------------------------(READ)----------------RUBRIC ITEM 2
app.get("/api/departments", async (req, res, next) => {
  try {
    const response = await client.query("SELECT * FROM departments");
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//GET /api/employees/:id

//POST /api/employees ----------------------------(CREATE)----------------RUBRIC ITEM 3
app.post("/api/employees", async (req, res, next) => {
  try {
    const response = await client.query(
      "INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *",
      [req.body.name, req.body.department_id]
    );
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/employees/:id ----------------------------(UPDATE)----------------RUBRIC ITEM 5
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const response = await client.query(
      "UPDATE employees SET name = $1, department_id = $2 WHERE id = $3 RETURNING *",
      [req.body.name, req.body.department_id, req.params.id]
    );
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// below code was created during wednesday recitation
// app.put("/api/employees/:id", async (req, res, next) => {
//   try {
//     const SQL = `
//         UPDATE employees SET name = $1, department_id = $2 WHERE id = $3 RETURNING *
//         `;
//     const response = await client.query(SQL, [
//       req.body.name,
//       req.body.department_id,
//       req.params.id,
//     ]);
//     res.send(response.rows[0]);
//   } catch (error) {
//     next(error);
//   }
// });

//DELETE /api/employees/:id ----------------------------(DELETE)----------------RUBRIC ITEM 4
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const response = await client.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.send("employee obliterated, well done");
  } catch (error) {
    next(error);
  }
});

//ERROR HANDLING----------------------------------------------------------------RUBRIC ITEM 6
app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error.message });
});

//init it
const init = async () => {
  //connect to db
  await client.connect();
  //create the tabls n stuff be sure its idempotent
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES departments(id)
    );
    `;
  await client.query(SQL);
  //seed it
  SQL = `
    INSERT INTO departments (name) VALUES ('Engineering');
    INSERT INTO departments (name) VALUES ('HR');
    INSERT INTO departments (name) VALUES ('Marketing');
    INSERT INTO employees (name, department_id) VALUES ('Alice', (SELECT id FROM departments WHERE name = 'Engineering'));
    INSERT INTO employees (name, department_id) VALUES ('Bob', (SELECT id FROM departments WHERE name = 'Marketing'));
    INSERT INTO employees (name, department_id) VALUES ('Charlie', (SELECT id FROM departments WHERE name = 'HR'));
    `;
  await client.query(SQL);
  console.log("it are seeded");

  //listen for db connection
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};
init();
