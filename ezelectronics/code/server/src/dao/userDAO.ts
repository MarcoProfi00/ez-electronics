import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError, UserIsAdminUpdateError } from "../errors/userError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM Users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)){
                            resolve(false)
                            return
                        }
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO Users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: Users.username")){
                            reject(new UserAlreadyExistsError())
                            return
                        }
                        reject(err)
                        return 
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM Users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /*
    getUserByUsername2(user: User, username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    // if(user.username !== row.username){
                    //     if(user.role !== "Admin"){
                    //         reject(new UnauthorizedUserError())
                    //     }
                    // }

                    const userInfo: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(userInfo)
                })
            } catch (error) {
                reject(error)
            }

        })
    }*/

    getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM Users"
                db.all(sql, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!rows) {
                        const usersEmpty: User[] = []
                        resolve(usersEmpty)
                        return
                    }
                    const users: User[] = rows.map((row: any) => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate))
                    resolve(users)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getUsersByRole(role: string): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM Users WHERE role = ?"
                db.all(sql, [role], (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!rows) {
                        const usersEmpty: User[] = []
                        resolve(usersEmpty)
                        return
                    }
                    const users: User[] = rows.map((row: any) => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate))
                    resolve(users)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteUser(user: User, username: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sqlSelect = "SELECT * FROM Users WHERE username = ?";
                db.get(sqlSelect, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new UserNotFoundError());
                        return;
                    }
                    if (user.username !== row.username) {
                        if (row.role === "Admin") {
                            reject(new UserIsAdminError());
                            return;
                        }
                    }
    
                    const sql2 = "SELECT cart_id FROM Carts WHERE username = ?";
                    db.all(sql2, [username], (err: Error | null, cartRows: any[]) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        if (cartRows.length > 0) {
                            const carts: number[] = cartRows.map((row: any) => row.cart_id);
                            const placeholders = carts.map(() => '?').join(',');
    
                            const sqlDeleteCartProduct = `DELETE FROM Cart_Product WHERE cart_id IN (${placeholders})`;
                            db.run(sqlDeleteCartProduct, carts, (err: Error | null) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
    
                                const sqlDeleteCarts = `DELETE FROM Carts WHERE cart_id IN (${placeholders})`;
                                db.run(sqlDeleteCarts, carts, (err: Error | null) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
    
                                    const sqlDeleteReviews = `DELETE FROM Reviews WHERE username = ?`;
                                    db.run(sqlDeleteReviews, [username], (err: Error | null) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        }
    
                                        const sqlDeleteUser = "DELETE FROM Users WHERE username = ?";
                                        db.run(sqlDeleteUser, [username], (err: Error | null) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            resolve(true);
                                        });
                                    });
                                });
                            });
                        } else {
                            const sqlDeleteReviews = `DELETE FROM Reviews WHERE username = ?`;
                            db.run(sqlDeleteReviews, [username], (err: Error | null) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
    
                                const sqlDeleteUser = "DELETE FROM Users WHERE username = ?";
                                db.run(sqlDeleteUser, [username], (err: Error | null) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(true);
                                });
                            });
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    
    deleteAll(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                // Seleziona tutti gli utenti che non sono amministratori
                const sqlSelect = "SELECT username FROM Users WHERE role != 'Admin'";
                db.all(sqlSelect, [], (err: Error | null, users: any[]) => {
                    if (err) {
                        reject(err);
                        return;
                    }
    
                    if (users.length === 0) {
                        resolve(true);
                        return;
                    }
    
                    const usernames = users.map(user => user.username);
                    const placeholders = usernames.map(() => '?').join(',');
    
                    // Seleziona tutti i carrelli associati agli utenti da eliminare
                    const sqlSelectCarts = `SELECT cart_id FROM Carts WHERE username IN (${placeholders})`;
                    db.all(sqlSelectCarts, usernames, (err: Error | null, carts: any[]) => {
                        if (err) {
                            reject(err);
                            return;
                        }
    
                        if (carts.length > 0) {
                            const cartIds = carts.map(cart => cart.cart_id);
                            const cartPlaceholders = cartIds.map(() => '?').join(',');
    
                            // Elimina i prodotti del carrello associati ai carrelli da eliminare
                            const sqlDeleteCartProducts = `DELETE FROM Cart_Product WHERE cart_id IN (${cartPlaceholders})`;
                            db.run(sqlDeleteCartProducts, cartIds, (err: Error | null) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
    
                                // Elimina i carrelli associati agli utenti da eliminare
                                const sqlDeleteCarts = `DELETE FROM Carts WHERE cart_id IN (${cartPlaceholders})`;
                                db.run(sqlDeleteCarts, cartIds, (err: Error | null) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
    
                                    // Elimina le recensioni associate agli utenti da eliminare
                                    const sqlDeleteReviews = `DELETE FROM Reviews WHERE username IN (${placeholders})`;
                                    db.run(sqlDeleteReviews, usernames, (err: Error | null) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        }
    
                                        // Elimina gli utenti non amministratori
                                        const sqlDeleteUsers = `DELETE FROM Users WHERE role != 'Admin'`;
                                        db.run(sqlDeleteUsers, [], (err: Error | null) => {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            resolve(true);
                                        });
                                    });
                                });
                            });
                        } else {
                            // Se non ci sono carrelli associati, procedi con l'eliminazione delle recensioni
                            const sqlDeleteReviews = `DELETE FROM Reviews WHERE username IN (${placeholders})`;
                            db.run(sqlDeleteReviews, usernames, (err: Error | null) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
    
                                // Elimina gli utenti non amministratori
                                const sqlDeleteUsers = `DELETE FROM Users WHERE role != 'Admin'`;
                                db.run(sqlDeleteUsers, [], (err: Error | null) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(true);
                                });
                            });
                        }
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    

    updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM Users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    if(user.username !== row.username){
                        if(user.role !== "Admin"){
                            reject(new UserNotAdminError())
                            return
                        }
                        if(row.role === "Admin"){
                            reject(new UnauthorizedUserError())
                            return
                        }
                    }
                    const sql = "UPDATE Users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?"
                    db.run(sql, [name, surname, address, birthdate, username], (err: Error | null) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        const sqlSelect = "SELECT * FROM Users WHERE username = ?";
                        db.get(sqlSelect, [username], (err: Error | null, row: any) => {
                            if (err) {
                                reject(err)
                                return
                            }
                            const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                            resolve(user)
                        })
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

}
export default UserDAO;