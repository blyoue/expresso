const express = require('express');
const sqlite3 = require('sqlite3');
const timesheetsRouter = require('./timesheets');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const employeesRouter = express.Router();

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);


employeesRouter.param('employeeId', (req, res, next, id) => {
    const employeeId = Number(id);
    db.get("SELECT * FROM Employee WHERE id = $id", { $id: employeeId }, (err, row) => {
        if (err) {
            return next(err);
        }
        if (row) {
            req.employee = row;
            next();
        } else {
            return res.sendStatus(404);
        }
    });
});

// GET all
employeesRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Employee WHERE is_current_employee = 1", (err, rows) => {
        if (err) {
            return next(err);
        } 
        return res.status(200).send({ employees: rows });
    });
});

// GET single employee
employeesRouter.get('/:employeeId', (req, res, next) => {
    const employee = req.employee;
    return res.status(200).send({ employee: employee });
})


//POST
employeesRouter.post('/', (req, res, next) => {
    const employee = req.body.employee;
    if (employee.name && employee.position && employee.wage) {
        if (!employee.isCurrentEmployee) {
            employee.isCurrentEmployee = 1
        }
        const query = "INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $is_current_employee)";
        const values = {
            $name: employee.name,
            $position: employee.position,
            $wage: employee.wage,
            $is_current_employee: employee.isCurrentEmployee
        }
        db.run(
            query, 
            values, 
            function (err) {
                if (err) {
                    return next(err);
                }
                db.get("SELECT * FROM Employee WHERE id = $id", { $id: this.lastID }, (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    return res.status(201).send({ employee: row });
                });
            }
        );
    } else {
        return res.sendStatus(400);
    }
});

//PUT
employeesRouter.put('/:employeeId', (req, res, next) => {
    const newEmployee = req.body.employee;
    const existingEmployee = req.employee;
    if (newEmployee.name && newEmployee.position && newEmployee.wage) {
        db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id", 
            {
                $name: newEmployee.name,
                $position: newEmployee.position,
                $wage: newEmployee.wage,
                $id: existingEmployee.id
            },
            err => {
                if (err) {
                    return next(err);
                }
                db.get("SELECT * FROM Employee WHERE id = $id", { $id: existingEmployee.id }, (err, row) => {
                    if (err) {
                        return next(err);
                    } 
                    return res.status(200).send({ employee: row });
                });
            }
        )
    } else {
        res.sendStatus(400);
    }
});

//DELETEs
employeesRouter.delete('/:employeeId', (req, res, next) => {
    const idToDelete = req.employee.id;
    db.run(
        "UPDATE Employee SET is_current_employee = 0 WHERE id = $id", { $id: idToDelete },
        err => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Employee WHERE id = $id", { $id: idToDelete },
                (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    return res.status(200).send({ employee: row });
                }
            );
        }
    )
});

module.exports = employeesRouter;