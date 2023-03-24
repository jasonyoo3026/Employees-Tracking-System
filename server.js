const express = require('express');
const mysql = require("mysql2");
const inquirer = require("inquirer");
// require("dotenv").config();
require("console.table");

const PORT = process.env.PORT || 3306;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const connection = mysql.createConnection(
  {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Password!2023",
  database: "employees_db"
  },
  console.log("You are now connected to the employees_db!"),
);

// this connects to the mysql server and database
connection.connect(function (err) {
  if (err) throw err;
  mainQuestions();
});

// function which prompts the user for what action they should take
function mainQuestions() {
  inquirer
    .prompt({
      type: "list",
      name: "task",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "Add an Employee",
        "Update Employee Role",
        "View All Roles",
        "Add a Role",
        "View All Departments",
        "Add a Department",
        "Quit"
      ]
    })
    .then(function ({ task }) {
      switch (task) {
        case "View All Employees":
          viewAllEmployees();
          break;
        case "Add an Employee":
          addEmployee();
          break;
        case "Update Employee Role":
          updateEmployeeRole();
          break;
        case "View All Roles":
          viewAllRoles();
          break;
        case "Add a Role":
          addRole();
          break;
        case "View All Departments":
          viewAllDept();
          break;
        case "Add a Department":
          addDepartment();
          break;
        // case "Update employee managers"
        //   updateManagers(); 
        //   break;
        // case "View employees by manager"
        //   viewEmployeesByManager();
        //   break;
        // case "View employees by departement"
        //   employeesBydept();
        //   break;
        // case "Delete departments"
        //   deleteDept();
        //   break;
        // case "Delete roles"
        //   deleteRoles();
        //   break;
        // case "Delete employees"
        //   deleteEmployees();
        //   break;
        // case "View combined salaries"
        //   viewCombSalaries();
        //   break;
        case "Quit":
          connection.end();
          break;
      }
    });
}

// 1."View All Employees"

function viewAllEmployees() {

  var query =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  LEFT JOIN role r
	ON e.role_id = r.id
  LEFT JOIN department d
  ON d.id = r.department_id
  LEFT JOIN employee m
	ON m.id = e.manager_id`

  connection.query(query, function (err, res) {
    if (err) throw err;
    console.table(res);
    console.log("All Employees are viewed!\n");

    mainQuestions();
  });
}

// 2. Add an employee
function addEmployee() {
  console.log("Adding a new employee!");

  var queryRoles =
    `SELECT r.id, r.title, r.salary 
      FROM role r`;

  connection.query(queryRoles, function (error, response) {
    if (error) throw error;

    const availableRoles = response.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`
    }));

    inquirer
      .prompt([
        {
          type: "input",
          name: "firstName",
          message: "Enter the employee's first name:"
        },
        {
          type: "input",
          name: "lastName",
          message: "Enter the employee's last name:"
        },
        {
          type: "list",
          name: "selectedRole",
          message: "Choose the employee's role:",
          choices: availableRoles
        },
      ])
      .then(function (answer) {
        console.log(answer);

        var insertQuery = `INSERT INTO employee SET ?`;

        connection.query(insertQuery,
          {
            first_name: answer.firstName,
            last_name: answer.lastName,
            role_id: answer.selectedRole,
            manager_id: answer.managerId,
          },
          function (error, response) {
            if (error) throw error;

            console.table(response);
            console.log(response.insertedRows + "Employee added successfully!\n");

            mainQuestions();
          });
      });
  });
}

// 3. Update employee's role
function updateEmployeeRole() {
  var employeeQuery =
    `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
  FROM employee e
  JOIN role r
	ON e.role_id = r.id
  JOIN department d
  ON d.id = r.department_id
  JOIN employee m
	ON m.id = e.manager_id`;

  var roleQuery =
    `SELECT r.id, r.title, r.salary 
  FROM role r`;

  connection.query(employeeQuery, function (err, employeeRes) {
    if (err) throw err;

    const employeeChoices = employeeRes.map(({ id, first_name, last_name }) => ({
      value: id, name: `${first_name} ${last_name}`
    }));

    connection.query(roleQuery, function (err, roleRes) {
      if (err) throw err;

      const roleChoices = roleRes.map(({ id, title, salary }) => ({
        value: id, name: `${title}`, salary: `${salary}`
      }));

      inquirer
        .prompt([
          {
            type: "list",
            name: "employeeId",
            message: "Which employee's role do you want to update?",
            choices: employeeChoices
          },
          {
            type: "list",
            name: "roleId",
            message: "Which role do you want to assign the selected employee?",
            choices: roleChoices
          },
        ])
        .then(function (answer) {

          var query = `UPDATE employee SET role_id = ? WHERE id = ?`;

          connection.query(query,
            [ answer.roleId,
              answer.employeeId
            ],
            function (err, res) {
              if (err) throw err;

              console.log("Updated employee's role successfully!");

              mainQuestions();
            });
        });
    });
  });
}


//4. View all roles
function viewAllRoles() {
  var dbQuery = `SELECT role.id, role.title, department.name as department_name, role.salary
  FROM role
  JOIN department ON role.department_id = department.id;`;
  connection.query(dbQuery, function(err, dbQuery){
    console.table(dbQuery);
    mainQuestions();
  });
};

//5. Add a role
function addEmployee() {
  console.log("Adding a new employee!");

  var queryRoles =
    `SELECT r.id, r.title, r.salary 
      FROM role r`;

  connection.query(queryRoles, function (error, response) {
    if (error) throw error;

    const availableRoles = response.map(({ id, title}) => ({
      value: id, name: `${title}`
    }));

    connection.query("SELECT * FROM employee", function (error, employees) {
      if (error) throw error;

      const managerOptions = employees.map(({ id, first_name, last_name }) => ({
        value: id, name: `${first_name} ${last_name}`
      }));

      managerOptions.unshift({ value: null, name: 'None' });

      inquirer
        .prompt([
          {
            type: "input",
            name: "firstName",
            message: "Enter the employee's first name:"
          },
          {
            type: "input",
            name: "lastName",
            message: "Enter the employee's last name:"
          },
          {
            type: "list",
            name: "selectedRole",
            message: "Choose the employee's role:",
            choices: availableRoles
          },
          {
            type: "list",
            name: "managerId",
            message: "Choose the employee's manager:",
            choices: managerOptions
          },
        ])
        .then(function (answer) {
          console.log(answer);

          var insertQuery = `INSERT INTO employee SET ?`;

          connection.query(insertQuery,
            {
              first_name: answer.firstName,
              last_name: answer.lastName,
              role_id: answer.selectedRole,
              manager_id: answer.managerId,
            },
            function (error, response) {
              if (error) throw error;

              console.log("Added to the database successfully!\n");

              mainQuestions();
            });
        });
    });
  });
}


//6. View all departments
function viewAllDept() {
  console.log("You are viewing all departments in this company\n");

  var query =
    `SELECT * FROM employees_db.department`

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("All departments are viewed!\n");

    mainQuestions();
  });
};

//7. Add a department
function addDepartment() {
  inquirer
    .prompt([
      {
        name: "departmentName",
        type: "input",
        message: "What is the name of the department that you want to add?",
      },
    ])
    .then(function (answer) {
      connection.query(
        "INSERT INTO department SET ?",
        {
          name: answer.departmentName,
        },
        function (err) {
          if (err) throw err;
          console.log(`New department ${answer.departmentName} successfully added!`);
          mainQuestions();
        }
      );
    });
}