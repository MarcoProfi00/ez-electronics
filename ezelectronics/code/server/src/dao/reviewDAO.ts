import db from "../db/db"
import {User} from "../components/user"
import { ProductReview } from "../components/review"
import crypto from "crypto"
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import * as productErrors from "../errors/productError";
import dayjs from "dayjs";
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    addReview(model: string, user: User, score: number, comment: string): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM Products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if(!row || row.model !== model) {
                        reject (new productErrors.ProductNotFoundError())
                        return
                    }
                    const reviewSql = "SELECT * FROM Reviews WHERE model = ? AND username = ?";
                    db.get(reviewSql, [model, user.username], (err: Error | null, row: any) => {
                        if(err){
                            return reject(err);
                        }
                        if(row){
                            return reject(new ExistingReviewError());
                        }
                        const date = dayjs().format("YYYY-MM-DD");
                        const sql = "INSERT INTO Reviews(model, username, score, date, comment) VALUES(?, ?, ?, ?, ?)";
                        db.run(sql, [model, user.username, score, date, comment], (err: Error | null) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            resolve()
                        })
                    })

                })
            }catch (error) {
                reject(error)
            }
            
        })

    }

    //Ritornare tutte le recensioni di un prodotto
    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                const sqlProduct = "SELECT * FROM Products WHERE model = ?"
                db.get(sqlProduct, [model], (err: Error | null, row: any) => {
                    if (err) {
                       return reject(err)
                    }
                    if(!row || row.model !== model) {
                        return reject (new productErrors.ProductNotFoundError())
                    }
                    const sql = "SELECT * FROM Reviews WHERE model = ?"
                    db.all(sql, [model], (err: Error | null, rows: any) => {
                        if (err) {
                            return reject(err)
                        }
                        if (rows.length === 0) {
                            return resolve([]);
                        }
                        const productReviews: ProductReview[] = []
                        for (let i = 0; i < rows.length; i++) {
                            productReviews[i] = new ProductReview(rows[i].model, rows[i].username, Number(rows[i].score), rows[i].date, rows[i].comment)
                        }
                        resolve(productReviews)
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    //cancellare una recensione fatta da un utente
    deleteReview(model: string, user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sqlProduct = "SELECT * FROM Products WHERE model = ?"
                db.get(sqlProduct, [model], (err: Error | null, row: any) => {
                    if (err) {
                       return reject(err)
                    }
                    if(!row || row.model !== model) {
                        return reject (new productErrors.ProductNotFoundError())
                    }
                    const sqlSelect = "SELECT * FROM Reviews WHERE model = ? AND username = ?";
                    db.get(sqlSelect, [model, user.username], (err: Error | null, row: any) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        if (!row) {
                            reject(new NoReviewProductError())
                            return
                        }
                        const sql = "DELETE FROM Reviews WHERE model = ? AND username = ?";
                        db.run(sql, [model, user.username], (err: Error | null) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            resolve()
                        })
                    })
                })
            } catch (error) {
                reject(error)
            }
        
    })}

    //eliminare tutte le recensioni di un prodotto
    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sqlProduct = "SELECT * FROM Products WHERE model = ?"
                db.get(sqlProduct, [model], (err: Error | null, row: any) => {
                    if (err) {
                       return reject(err)
                    }
                    if(!row || row.model !== model) {
                        return reject (new productErrors.ProductNotFoundError())
                    }
                    const sql = "DELETE FROM Reviews WHERE model = ?";
                    db.run(sql, [model], (err: Error | null) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        resolve()
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    //eliminare tutte le recensioni
    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM Reviews";
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }



}

export default ReviewDAO;