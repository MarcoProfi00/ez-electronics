/**
 * GET ezelectronics/carts ritorna il carrello corrente
 *      logged user
 *      se non c'è un carrello unpaid ritorna carrello vuoto (empty)
 *      
 * POST ezelectronics/carts -> aggiunge un prodotto al carrello corrente
 *      
 * PATCH ezelectronics/carts -> update payment 1 
 * GET ezelectronics/carts/history -> get storico carrelli (paid = 1)
 * DELETE ezelectronics/carts/products/:model -> rimuove un'istanza di un prodotto (quantity)
 *  se quantity è 1 allora lo elimina
 * DELETE ezelectronics/carts/current -> svuota il carrello
 * DELETE ezelectronics/carts -> cancella i carrelli di tutti gli utenti (Admin o Manager)
 * GET ezelectronics/carts/all -> ritorna tutti i carrelli di tutti gli utenti (Admin o Manager)
 */
import db from "../db/db"
import { User } from "../components/user"
import { Product, Category } from "../components/product"
import { Cart, ProductInCart } from "../components/cart"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";
import { rejects } from "assert";
import { LowProductStockError, ProductNotFoundError, EmptyProductStockError } from "../errors/productError"
import { resolve } from "path"
import { error } from "console"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError"
import dayjs from "dayjs"

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    /**
     * Return the current cart
     * @param username The username of the user.
     * @return A Promise that resolves to true if the cart is unpaid, false otherwise
     */

    getCurrentCart(username: string): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                //query per ritornare il carrello non pagato
                let sql = "SELECT * FROM Carts WHERE username = ? AND paid = 0"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                    }
                    if (!row) {
                        //ritorna carrello vuoto se username non ha carrelli, o sono tutti pagati
                        const productCart: ProductInCart[] = []
                        resolve(new Cart(username, false, null, 0, productCart))
                    } else {
                        //entra se esiste un carrello non pagato associato a username                       
                        //controlla se ci sono prodotti nel carrello
                        if (Number(row.total) === 0) {
                            const productCart: ProductInCart[] = []
                            resolve(new Cart(username, false, null, 0, productCart))
                        }

                        const cartId = row.cart_id
                        const total = Number(row.total)

                        //query per capire i modelli e le quantità dei prodotti nel cart
                        sql = "SELECT * FROM Cart_Product WHERE cart_id=?"
                        db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                            if (err) {
                                reject(err)
                            } else {
                                //query join per ricavare le informazioni sui prodotti presenti nel carrello
                                sql = `SELECT Cart_Product.model, Products.category, Cart_Product.quantity, Products.sellingPrice
                                       FROM Cart_Product, Products
                                       WHERE Cart_Product.model = Products.model AND Cart_Product.cart_id = ?`
                                db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                                    if (err) {
                                        reject(err)
                                    } else {

                                        const productsInCart: ProductInCart[] = []
                                        rows.forEach((row) => {
                                            let category: Category = Category.SMARTPHONE
                                            switch (row.category) {
                                                case 'Smartphone':
                                                    category = Category.SMARTPHONE;
                                                    break
                                                case 'Laptop':
                                                    category = Category.LAPTOP;
                                                    break
                                                case 'Appliance':
                                                    category = Category.APPLIANCE;
                                                    break
                                            }
                                            productsInCart.push(new ProductInCart(row.model, Number(row.quantity), category, Number(row.sellingPrice)))
                                        })
                                        resolve(new Cart(username, false, null, total, productsInCart))
                                    }
                                })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Add a product to the current cart
     * @param username The username of the user.
     * @param model The model of the product 
     * @return A Promise that resolves to true if the product is successfully add to cart, false otherwise
     */

    addToCurrentCart(username: string, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                //caso in cui non esista il prodotto nel db 404 error
                let sql = "SELECT quantity FROM Products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                    } else if (!row) {
                        reject(new ProductNotFoundError())
                    } else if (row && Number(row.quantity) === 0) {
                        //caso in cui esiste il prodotto ma quantity = 0 409 error
                        reject(new EmptyProductStockError())
                    } else {
                        //query per vedere se c'è un carrello non pagato
                        sql = "SELECT * FROM Carts WHERE username=? AND paid = 0"
                        db.get(sql, [username], (err: Error | null, row: any) => {
                            if (err) {
                                reject(err);
                            } if (!row) { //caso in cui non c'è il carrello non pagato oppure non esiste un carrello
                                //query per inserire un carrello
                                sql = "INSERT INTO Carts (username, paid, paymentDate, total) VALUES (?, ?, ?, ?)"
                                db.run(sql, [username, 0, null, 0], function (err) {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        let total = 0
                                        const cartId = this.lastID; //ritorna l'id dell'ultima riga aggiunta
                                        //query per inserire un prodotto nel carrello
                                        sql = "INSERT INTO Cart_Product (cart_id, model, quantity) VALUES (?, ?, ?)"
                                        db.run(sql, [cartId, model, 1], function (err) {
                                            if (err) {
                                                reject(err)
                                            } else {
                                                //bisogna aggiornare il total del carrello
                                                //query per trovare il prezzo del prodotto da aggiungere
                                                sql = "SELECT sellingPrice FROM Products WHERE model = ?"
                                                db.get(sql, [model], (err: Error | null, row: any) => {
                                                    if (err) {
                                                        reject(err)
                                                    } else {
                                                        const price = Number(row.sellingPrice)
                                                        total = total + price
                                                        //query per aggiornare il total del carrello
                                                        sql = "UPDATE Carts SET total = ? WHERE cart_id = ?"
                                                        db.run(sql, [total, cartId], function (err) {
                                                            if (err) {
                                                                reject(err)
                                                                return
                                                            }
                                                            resolve(true)
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            } else {
                                let total = Number(row.total)
                                const cartId = Number(row.cart_id)
                                //query per verificare se il prodotto è nel carrello
                                sql = "SELECT * FROM Cart_Product WHERE cart_id = ? AND model = ?"
                                db.get(sql, [cartId, model], (err: Error | null, row: any) => {
                                    if (err) {
                                        reject(err)
                                    } else if (!row) { //caso in cui non c'è il prodotto nel carrello
                                        sql = "INSERT INTO Cart_Product (cart_id, model, quantity) VALUES (?, ?, ?)"
                                        db.run(sql, [cartId, model, 1], function (err) {
                                            if (err) {
                                                reject(err)
                                            } else {
                                                //bisogna aggiornare il total del carrello
                                                //query per trovare il prezzo del prodotto da aggiungere
                                                sql = "SELECT sellingPrice FROM Products WHERE model = ?"
                                                db.get(sql, [model], (err: Error | null, row: any) => {
                                                    if (err) {
                                                        reject(err)
                                                    } else {
                                                        const price = Number(row.sellingPrice)
                                                        total = total + price
                                                        //query per aggiornare il total del carrello
                                                        sql = "UPDATE Carts SET total = ? WHERE cart_id = ?"
                                                        db.run(sql, [total, cartId], function (err) {
                                                            if (err) {
                                                                reject(err)
                                                            }
                                                            resolve(true)
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        //caso in cui il prodotto è gia nel carrello
                                        const quantity = Number(row.quantity) + 1
                                        sql = "UPDATE Cart_Product SET quantity = ? WHERE model = ?"
                                        db.run(sql, [quantity, model], function (err) {
                                            if (err) {
                                                reject(err)
                                            } else {
                                                //bisogna aggiornare il total del carrello
                                                //query per trovare il prezzo del prodotto da aggiungere
                                                sql = "SELECT sellingPrice FROM Products WHERE model = ?"
                                                db.get(sql, [model], (err: Error | null, row: any) => {
                                                    if (err) {
                                                        reject(err)
                                                    } else {
                                                        const price = Number(row.sellingPrice)
                                                        total = total + price
                                                        //query per aggiornare il total del carrello
                                                        sql = "UPDATE Carts SET total = ? WHERE cart_id = ?"
                                                        db.run(sql, [total, cartId], function (err) {
                                                            if (err) {
                                                                reject(err)
                                                                return
                                                            }
                                                            resolve(true)
                                                        })
                                                    }
                                                })

                                            }

                                        })
                                    }
                                })
                            }

                        })
                    }
                })

            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Simulate the payment of the current cart
     * @param username The username of the user.
     * @return A Promise that resolves to true if the checkout was successful, false otherwise
     */

    checkoutCart(username: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                //query per selezionare un carrello non pagato
                let sql = "SELECT * FROM Carts WHERE username = ? AND paid = 0"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                    } else if (!row) {
                        //errore se non trova il carrello non pagato
                        reject(new CartNotFoundError())
                    } else {
                        const cartId = Number(row.cart_id)
                        //query per vedere se nel carrello ci sono prodotti
                        sql = "SELECT * FROM Cart_Product WHERE cart_id = ?"
                        db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                            if (err) {
                                reject(err)
                            } else if (rows.length === 0) {
                                //errore carrello vuoto
                                reject(new EmptyCartError())
                            } else {
                                const models: string[] = rows.map((row: any) => row.model)
                                const placeholders = rows.map(() => '?').join(',')
                                const quantities: number[] = rows.map((row: any) => Number(row.quantity))
                                //query per ricavare le quantità disponibili dei prodotti presenti nel carrello
                                sql = `SELECT quantity FROM Products WHERE model IN (${placeholders})`
                                db.all(sql, models, async (err: Error | null, rows: any[]) => {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        const stockQuantities: number[] = rows.map((row: any) => Number(row.quantity))
                                        for (let i = 0; i < stockQuantities.length; i++) {
                                            if (stockQuantities[i] === 0) {
                                                //errore prodotto con quantità = 0 nel magazzino
                                                reject(new EmptyProductStockError())
                                                return
                                            } else if (quantities[i] > stockQuantities[i]) {
                                                //errore prodotto con quantità superiore a quella del magazzino
                                                reject(new LowProductStockError())
                                                return
                                            }
                                        }

                                        let newQuantities: number[] = []
                                        for (let i = 0; i < models.length; i++) {
                                            newQuantities[i] = stockQuantities[i] - quantities[i]
                                        }
                                        sql = "BEGIN TRANSACTION;";
                                        for (let i = 0; i < newQuantities.length; i++) {
                                            sql += `UPDATE Products SET quantity = ${newQuantities[i]} WHERE model = '${models[i]}';`
                                        }
                                        sql += "COMMIT;"
                                        db.exec(sql, function (err) {
                                            if (err) {
                                                reject(err)
                                            }
                                            else {
                                                const today = dayjs().format("YYYY-MM-DD")
                                                //query per pagare il carrello
                                                sql = "UPDATE Carts SET paid = 1, paymentDate = ? WHERE cart_id = ?"
                                                db.run(sql, [today, cartId], function (err) {
                                                    if (err) {
                                                        reject(err)
                                                    } else {
                                                        resolve(true)
                                                    }
                                                })
                                            }
                                        })

                                    }
                                })
                            }
                        })
                    }
                })

            } catch (err) {
                reject(err)
            }
        })
    }




    /**
     * Retrieves all paid carts for a specific customer.
     * @param username - The username of the customer.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    getCustomerCarts(username: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const carts: Cart[] = [];
                // Query iniziale per ottenere tutti i carrelli pagati per l'username
                let sql = "SELECT * FROM Carts WHERE username = ? AND paid = 1";
                db.all(sql, [username], async (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                    } else if (rows.length === 0) {
                        // Ritorna un array vuoto se non ci sono carrelli pagati
                        resolve(carts);
                    } else {
                        // Processa ogni carrello
                        for (let i = 0; i < rows.length; i++) {
                            try {
                                carts[i] = await new Promise<Cart>((resolve, reject) => {
                                    const cartId = rows[i].cart_id;
                                    const total = Number(rows[i].total);
                                    const paymentDate = rows[i].paymentDate;

                                    sql = ` SELECT Cart_Product.model, Products.category, Cart_Product.quantity, Products.sellingPrice
                                            FROM Cart_Product, Products
                                            WHERE Cart_Product.model = Products.model AND Cart_Product.cart_id = ?`
                                    db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                                        if (err) {
                                            reject(err)
                                        } else {
                                            const productsInCart: ProductInCart[] = []
                                            rows.forEach((row) => {
                                                let category: Category = Category.SMARTPHONE
                                                switch (row.category) {
                                                    case 'Smartphone':
                                                        category = Category.SMARTPHONE;
                                                        break
                                                    case 'Laptop':
                                                        category = Category.LAPTOP;
                                                        break
                                                    case 'Appliance':
                                                        category = Category.APPLIANCE;
                                                        break
                                                }
                                                productsInCart.push(new ProductInCart(row.model, Number(row.quantity), category, Number(row.sellingPrice)))
                                            })
                                            resolve(new Cart(username, true, paymentDate, total, productsInCart))
                                        }
                                    })
                                })
                            } catch (err) {
                                reject(err);
                            }
                        }
                        resolve(carts);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */

    removeProductFromCart(username: string, model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {

                let sql = "SELECT * FROM Products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                    } else if (!row) {
                        reject(new ProductNotFoundError())  //caso in cui il prodotto non esiste nel db
                    } else {

                        const price = Number(row.sellingPrice)
                        sql = "SELECT * FROM Carts WHERE username = ? AND paid = 0"
                        db.get(sql, [username], (err: Error | null, row: any) => {
                            if (err) {
                                reject(err)
                            } else if (!row) {    //caso in cui non esiste un carrello non pagato per quello username
                                reject(new CartNotFoundError())
                            } else {

                                //per vedere se ci sono prodotti nel carrello
                                let total = Number(row.total)
                                const cartId = Number(row.cart_id)
                                sql = "SELECT * FROM Cart_Product WHERE cart_id = ?"
                                db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                                    if (err) {
                                        reject(err)
                                    } else if (rows.length === 0) {
                                        reject(new CartNotFoundError())
                                    } else {

                                        //caso in cui ci sono prodotti nel carrello
                                        sql = "SELECT quantity FROM Cart_Product WHERE cart_id = ? AND model = ?"
                                        db.get(sql, [cartId, model], (err: Error | null, row: any) => {
                                            if (err) {
                                                reject(err)
                                            } else if (!row) {
                                                reject(new ProductNotInCartError())
                                            } else {

                                                //controllo quante istanze del prodotto sono nel carrello 
                                                let quantity = Number(row.quantity)
                                                if (quantity === 1) {   // caso in cui abbiamo una sola istanza del prodotto
                                                    sql = "DELETE FROM Cart_Product WHERE model = ? AND cart_id = ?"  //cancellazione prodotto dal carrello
                                                    db.run(sql, [model, cartId], function (err) {
                                                        if (err) {
                                                            reject(err)
                                                        } else {

                                                            //aggiornamento del total nel carrello 
                                                            total -= price
                                                            sql = "UPDATE Carts SET total = ? WHERE cart_id = ?"
                                                            db.run(sql, [total, cartId], function (err) {
                                                                if (err) {
                                                                    reject(err)
                                                                } else {
                                                                    resolve(true)
                                                                }
                                                            })
                                                        }
                                                    })
                                                } else {

                                                    // caso in cui abbiamo più istanze del prodotto
                                                    quantity -= 1
                                                    sql = "UPDATE Cart_Product SET quantity = ? WHERE model = ? AND cart_id = ?" //aggiornamento quantity nel carrello
                                                    db.run(sql, [quantity, model, cartId], function (err) {
                                                        if (err) {
                                                            reject(err)
                                                        } else {

                                                            //aggiornamento del total nel carrello 
                                                            total -= price
                                                            sql = "UPDATE Carts SET total = ? WHERE cart_id = ?"
                                                            db.run(sql, [total, cartId], function (err) {
                                                                if (err) {
                                                                    reject(err)
                                                                } else {
                                                                    resolve(true)
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }

                })

            } catch (err) {
                reject(err)
            }
        })
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */

    clearCart(username: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {

                let sql = "SELECT * FROM Carts WHERE username = ? AND paid = 0"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                    } else if (!row) {
                        reject(new CartNotFoundError())  // caso in cui non esiste il carrello non pagato per l'utente
                    } else {

                        //caso in cui esiste il carrello non pagato per l'utente
                        const cartId = Number(row.cart_id)
                        sql = "DELETE FROM Cart_Product WHERE cart_id = ?"
                        db.run(sql, [cartId], function (err) {
                            if (err) {
                                reject(err)
                            } else {

                                // aggiornamento del total del carrello a 0
                                sql = "UPDATE Carts SET total = 0 WHERE cart_id = ?"
                                db.run(sql, [cartId], function (err) {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        resolve(true)
                                    }
                                })
                            }
                        })
                    }
                })

            } catch (err) {
                reject(err)
            }
        })
    }


    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */

    deleteAllCarts(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {

                // elmiminazione di tutti i prodotti nei vari carrelli
                let sql = "DELETE FROM Cart_Product"
                db.run(sql, function (err) {
                    if (err) {
                        reject(err)
                    } else {

                        // eliminazione di tutti i carrelli presenti nel db
                        sql = "DELETE FROM Carts"
                        db.run(sql, function (err) {
                            if (err) {
                                reject(err)
                            } else {
                                resolve(true)
                            }
                        })
                    }
                })

            } catch (err) {
                reject(err)
            }
        })
    }


    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {

                const carts: Cart[] = []
                let sql = "SELECT * FROM Carts"
                db.all(sql, async (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                    } else if (rows.length === 0) {
                        resolve(carts)    //ritorna array di carrelli vuoto se non ci sono carrelli nel db
                    } else {

                        for (let i = 0; i < rows.length; i++) {
                            try {
                                carts[i] = await new Promise<Cart>((resolve, reject) => {
                                    const cartId = rows[i].cart_id;
                                    const total = Number(rows[i].total);
                                    const paymentDate = rows[i].paymentDate;
                                    const username = rows[i].username
                                    const paid = Number(rows[i].paid) === 1 ? true : false

                                    sql = ` SELECT Cart_Product.model, Products.category, Cart_Product.quantity, Products.sellingPrice
                                        FROM Cart_Product, Products
                                        WHERE Cart_Product.model = Products.model AND Cart_Product.cart_id = ?`
                                    db.all(sql, [cartId], (err: Error | null, rows: any[]) => {
                                        if (err) {
                                            reject(err)
                                        } else {
                                            const productsInCart: ProductInCart[] = []
                                            rows.forEach((row) => {
                                                let category: Category = Category.SMARTPHONE
                                                switch (row.category) {
                                                    case 'Smartphone':
                                                        category = Category.SMARTPHONE;
                                                        break
                                                    case 'Laptop':
                                                        category = Category.LAPTOP;
                                                        break
                                                    case 'Appliance':
                                                        category = Category.APPLIANCE;
                                                        break
                                                }
                                                productsInCart.push(new ProductInCart(row.model, Number(row.quantity), category, Number(row.sellingPrice)))
                                            })
                                            resolve(new Cart(username, paid, paymentDate, total, productsInCart))
                                        }
                                    })
                                })
                            } catch (err) {
                                reject(err)
                            }
                        }
                        resolve(carts)
                    }
                })
            } catch (err) {
                reject(err)
            }
        })
    }

}

export default CartDAO