"use strict"

import db from "./db"

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    return new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run("DELETE FROM Cart_Product", (err) => {
                if (err) return reject(err)
                db.run("DELETE FROM Carts", (err) => {
                    if (err) return reject(err)
                    db.run("DELETE FROM Reviews", (err) => {
                        if (err) return reject(err)
                        db.run("DELETE FROM Products", (err) => {
                            if (err) return reject(err)
                            db.run("DELETE FROM Users", (err) => {
                                if (err) return reject(err)
                                resolve()
                            })
                        })
                    })
                })
            })
        })
    })
}
