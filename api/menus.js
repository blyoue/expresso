const express = require('express');
const sqlite3 = require('sqlite3');
const menuItemsRouter = require('./menuitem');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menusRouter = express.Router();


const errorHandler = (err) => {
    if (err) {
        return next(err);
    }
}


// Menu Items
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

// Param
menusRouter.param('menuId', (req, res, next, id) => {
    const menuId = Number(id);
    db.get("SELECT * FROM Menu WHERE id = $id", { $id: menuId }, (err, row) => {
        errorHandler(err);
        if (row) {
            req.menu = row;
            next();
        } else {
            return res.sendStatus(404);
        }
    });
});

// GET all
menusRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM Menu", (err, rows) => {
        errorHandler(err);
        return res.status(200).send({ menus: rows });
    })
});

// GET a single menu
menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).send({ menu: req.menu});
})


// POST
menusRouter.post('/', (req, res, next) => {
    const newMenu = req.body.menu;
    if (newMenu.title) {
        db.run(
            "INSERT INTO Menu (title) VALUES ($title)", 
            { $title: newMenu.title }, 
            function (err) {
                errorHandler(err)
                db.get("SELECT * FROM Menu WHERE id = $id", { $id: this.lastID }, (err, row) => {
                    errorHandler(err)
                    return res.status(201).send({ menu: row });
                })
            }
        );
    } else { 
        return res.sendStatus(400);
    }
})

// PUT 
menusRouter.put('/:menuId', (req, res, next) => {
    const newMenu = req.body.menu;
    const existingMenuId = req.menu.id;
    if (newMenu.title) {
        db.run("UPDATE Menu SET title = $title WHERE id = $id", { $title: newMenu.title, $id: existingMenuId }, (err) => {
            errorHandler(err);
            db.get("SELECT * FROM Menu WHERE id = $id", { $id: existingMenuId }, (err, row) => {
                errorHandler(err);
                return res.status(200).send({ menu: row });
            })
        });
    } else {
        return res.sendStatus(400);
    }
});

module.exports = menusRouter;

//DELETE
menusRouter.delete('/:menuId', (req, res, next) => {
    const existingMenuId = req.menu.id;
    db.get("SELECT * FROM MenuItem WHERE menu_id = $menuId", { $menuId: existingMenuId }, (err, row) => {
        errorHandler(err);
        if (!row) {
            db.run("DELETE FROM Menu WHERE id = $id", { $id: existingMenuId }, (err) => {
                errorHandler(err);
                return res.sendStatus(204);
            });
        } else { 
            return res.sendStatus(400);
        }
    });
});