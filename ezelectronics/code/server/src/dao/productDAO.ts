import db from "../db/db";

import * as productErrors from "../errors/productError";

import dayjs from "dayjs";

import { Product } from "../components/product";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    addNewProduct(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // Check if the product already exists
                let sql = "SELECT * FROM Products WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (row) {
                        reject(new productErrors.ProductAlreadyExistsError());
                        return;
                    }

                    sql = "INSERT INTO Products (model, category, arrivalDate, sellingPrice, quantity, details) VALUES (?, ?, ?, ?, ?, ?)";
                    db.run(sql, [model, category, arrivalDate, sellingPrice, quantity, details], function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    })
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    changeProductQuantity(model: string, quantity: number, changeDate: string | null): Promise<{ quantity: number }> {
        return new Promise<{ quantity: number }>((resolve, reject) => {
            try {
                // Check if the product does not already exists
                let sql = "SELECT * FROM Products WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new productErrors.ProductNotFoundError());
                        return;
                    }

                    if (dayjs(changeDate).isBefore(dayjs(row.arrivalDate))) {
                        reject(new productErrors.ChangeDateBeforeArrivalDate());
                        return;
                    }   

                    const newQuantity = row.quantity + quantity;
                    sql = "UPDATE Products SET quantity = ? WHERE model = ?";
                    db.run(sql, [newQuantity, model], function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(newQuantity);
                    });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // Check if the product does not already exists
                let sql = "SELECT * FROM Products WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new productErrors.ProductNotFoundError());
                        return;
                    }

                    if (dayjs(sellingDate).isBefore(dayjs(row.arrivalDate))) {
                        reject(new productErrors.SellingDateBeforeArrivalDate());
                        return;
                    }

                    // Check the disponibility of the product
                    if (row.quantity == 0) {
                        reject(new productErrors.EmptyProductStockError());
                        return;
                    } else if (row.quantity < quantity) {
                        reject(new productErrors.LowProductStockError());
                        return;
                    }

                    const newQuantity = row.quantity - quantity;
                    sql = "UPDATE Products SET quantity = ? WHERE model = ?";
                    db.run(sql, [newQuantity, model], function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    getAllProducts(available: boolean): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = `SELECT * FROM Products ${available ? "WHERE quantity > 0" : ""}`;
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let products: Product[] = [];

                    for (const row of rows) {
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    }

                    resolve(products);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    getProductsByCategory(category: string, available: boolean): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = `SELECT * FROM Products WHERE category = ? ${available ? "AND quantity > 0" : ""}`;
                db.all(sql, [category], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let products: Product[] = [];

                    for (const row of rows) {
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    }

                    resolve(products);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    getProductByModel(model: string, available: boolean): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                const sql = `SELECT * FROM Products WHERE model = ?`;
                db.all(sql, [model], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (rows.length == 0) {
                        reject(new productErrors.ProductNotFoundError());
                        return;
                    }

                    if(rows[0].quantity == 0 && available) {
                        return resolve([]);
                    }

                    let products: Product[] = [];

                    for (const row of rows) {
                        products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    }

                    resolve(products);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    deleteAllProducts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM Products";
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }

    deleteProduct(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM Products WHERE model = ?";
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row) {
                        reject(new productErrors.ProductNotFoundError());
                        return;
                    }

                    sql = "DELETE FROM Products WHERE model = ?";
                    db.run(sql, [model], (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}

export default ProductDAO