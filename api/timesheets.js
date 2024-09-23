const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const timesheetsRouter = express.Router({mergeParams: true});

//PARAM
timesheetsRouter.param("timesheetId", (req, res, next, id) => {
    const timesheetId = Number(id);
    db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: timesheetId }, (err, row) => {
        if (err) {
            return next(err)
        }
        if (row) {
            req.timesheet = row;
            next();
        } else {
            res.sendStatus(404);
        }
    })
});

//GET
timesheetsRouter.get("/", (req, res, next) => {
    db.all("SELECT * FROM Timesheet WHERE employee_id = $id", { $id: req.employee.id }, (err, rows) => {
        if (err) {
            return next(err);
        }
        res.status(200).send({ timesheets: rows});
    });
});

//POST
timesheetsRouter.post("/", (req, res, next) => {
    const timesheet = req.body.timesheet;
    if (timesheet.hours && timesheet.rate && timesheet.date) {

        db.run(
            "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)", 
            {
                $hours: timesheet.hours,
                $rate: timesheet.rate,
                $date: timesheet.date,
                $employee_id: req.employee.id,
            },
            function (err) {
                if (err) {
                    return next(err);
                }
                db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: this.lastID }, (err, row) => {
                    if (err) {
                        return next(err);
                    }
                    if (row) {
                        res.status(201).send({ timesheet: row });
                    }
                })
            }
            
        )
    } else {
        return res.sendStatus(400);
    }
});
        
//PUT
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
    const newTimesheet = req.body.timesheet;
    const timesheetId = req.timesheet.id;
    if (newTimesheet.hours && newTimesheet.rate && newTimesheet.date) {
        db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id",
         {
            $hours: newTimesheet.hours,
            $rate: newTimesheet.rate,
            $date: newTimesheet.date,
            $id: timesheetId
         },
         (err) => {
            if (err) {
                return next(err);
            }
            db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: timesheetId }, (err, row) => {
                if (err) {
                    console.log("UCFUCJF");
                    return next(err);
                }
                return res.status(200).send({ timesheet: row });
            })   
        });
    } else {
        res.sendStatus(400);
    }
});      
        

//DELETE
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
    const timesheetId = req.timesheet.id;
    db.run("DELETE FROM Timesheet WHERE id = $id", { $id: timesheetId }, (err) => {
        if (err) {
            return next(err);
        }
        return res.sendStatus(204);
    });
})
        
module.exports = timesheetsRouter;