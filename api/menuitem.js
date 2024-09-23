const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuItemsRouter = express.Router({mergeParams: true});

const errorHandler = (err) => {
    if (err) {
        return next(err);
    }
}



// Param
menuItemsRouter.param('menuItemId', (req, res, next, id) => {
    const menuItemId = Number(id);
    db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: menuItemId }, (err, row) => {
        errorHandler(err);
        if (row) {
            req.menuItem = row;
            return next();
        } else {
            return res.sendStatus(404);
        }
    })
});



// GET

menuItemsRouter.get('/', (req, res, next) => {
    db.all("SELECT * FROM MenuItem WHERE menu_id = $menuId", { $menuId: req.menu.id }, (err, rows) => {
        errorHandler(err);
        res.status(200).send({ menuItems: rows });
    })
});


// POST 
menuItemsRouter.post('/', (req, res, next) => {
    const newMenuItem = req.body.menuItem;
    if (newMenuItem.name && newMenuItem.inventory && newMenuItem.price) {
        const query = "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)";
        const values = {
            $name: newMenuItem.name, 
            $description: newMenuItem.description, 
            $inventory: newMenuItem.inventory, 
            $price: newMenuItem.price, 
            $menuId: req.menu.id
        };
        db.run(query, values, function (err) {
            errorHandler(err);
            db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: this.lastID }, (err, row) => {
                errorHandler(err);
                return res.status(201).send({ menuItem: row });
            })
        });
    } else {
        return res.sendStatus(400);
    }
});

// PUT 
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
    const newMenuItem = req.body.menuItem;
    const existingMenuItemId = req.menuItem.id;
    if (newMenuItem.name && newMenuItem.inventory && newMenuItem.price) {
        const query = "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE id = $id";
        const values = {
            $name: newMenuItem.name, 
            $description: newMenuItem.description, 
            $inventory: newMenuItem.inventory, 
            $price: newMenuItem.price, 
            $id: existingMenuItemId
        };
        db.run(query, values, (err) => {
            errorHandler(err);
            db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: existingMenuItemId }, (err, row) => {
                errorHandler(err);
                return res.status(200).send({ menuItem: row });
            })
        })
    } else {
        return res.sendStatus(400);
    }
}); 


// DELETE
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $id", { $id: req.menuItem.id }, (err) => {
        errorHandler(err);
        return res.sendStatus(204);
    })
});

module.exports = menuItemsRouter;