import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user"
import { UserNotFoundError, UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UnauthorizedUserError } from "../../src/errors/userError"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

afterEach(() => {
    jest.resetAllMocks();
});

const DBerr = "DB Error";
const tryBlockError = "Error in Try block";

const testCustomer = new User("username", "mario", "pippo", Role.CUSTOMER, "", "");
const testAdmin = new User("admin", "mario", "peppe", Role.ADMIN, "", "");

const userRow = { 
    username: testCustomer.username,
    name: testCustomer.name,
    surname: testCustomer.surname, 
    address: testCustomer.address, 
    birthdate: testCustomer.birthdate, 
    password: "password", 
    salt: "salt", 
    role: testCustomer.role 
};

const adminRow = { 
    username: "admin1",
    name: "admin1",
    surname: "admin1", 
    address: "address", 
    birthdate: "birthdate", 
    password: "password", 
    salt: "salt", 
    role: Role.ADMIN 
};


const userAdminRow = { 
    username: "admin2",
    name: "admin",
    surname: "admin", 
    address: "test", 
    birthdate: "test", 
    password: "password", 
    salt: "salt", 
    role: Role.ADMIN 
};

describe("UserDAO", () => {
    const userDAO = new UserDAO();
    
    describe("getIsUserAuthenticated", () => {

        test("It should resolve with true if the user is authenticated", async () => {
            const mockRow = {
                username: 'testuser',
                password: 'hashedPassword',
                salt: 'salt'
            };
    
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, mockRow);
                return {} as Database;
            });
    
            //hashedPassword in db
            const mockHashedPassword = Buffer.from(mockRow.password);
            //hashedPassword creata dalla inputPassword 
            jest.spyOn(crypto, 'scryptSync').mockReturnValue(mockHashedPassword);
            //creazione di passwordHex dalla password (normale) in db
            jest.spyOn(Buffer, 'from').mockReturnValue(mockHashedPassword);
            //confronto fra passwordHex e hashedPassword creata dalla inputPassword
            jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true);
    
            const result = await userDAO.getIsUserAuthenticated(mockRow.username, 'plainPassword');
            expect(result).toBe(true);
            expect(db.get).toHaveBeenCalledTimes(1);
    
        });

        test("It should resolve with false if the inserted password is not correct", async () => {
            const mockRow = {
                username: 'testuser',
                password: 'hashedPassword',
                salt: 'salt'
            };
    
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, mockRow);
                return {} as Database;
            });
    
            //hashedPassword in db
            const mockHashedPassword = Buffer.from(mockRow.password);
            //hashedPassword creata dalla inputPassword 
            jest.spyOn(crypto, 'scryptSync').mockReturnValue(mockHashedPassword);
            //creazione di passwordHex dalla password (normale) in db
            jest.spyOn(Buffer, 'from').mockReturnValue(mockHashedPassword);
            //confronto fra passwordHex e hashedPassword creata dalla inputPassword
            jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false);
    
            const result = await userDAO.getIsUserAuthenticated(mockRow.username, 'plainPassword');
            expect(result).toBe(false);
            expect(db.get).toHaveBeenCalledTimes(1);

        });

        test("It should resolve with false if the user does not exist", async () => {
    
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
    
            const result = await userDAO.getIsUserAuthenticated("testUser", "password");
            expect(result).toBe(false);
            expect(db.get).toHaveBeenCalledTimes(1);

        });

        test("It should resolve with false if the there isn't any salt associated to the user in the database", async () => {
    
            const mockRow = {
                username: 'testuser',
                password: 'hashedPassword',
                salt: ""
            };

            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, mockRow);
                return {} as Database;
            });
    
            const result = await userDAO.getIsUserAuthenticated(mockRow.username, "password");
            expect(result).toBe(false);
            expect(db.get).toHaveBeenCalledTimes(1);

        });

        test("It should throw DB Error (db.get)", async () => {
    
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error(DBerr));
                return {} as Database;
            });
    
            await expect(userDAO.getIsUserAuthenticated("testUser", "password")).rejects.toThrow(DBerr);
            expect(db.get).toHaveBeenCalledTimes(1);

        });

        test("It should throw an error if throw in the try block", async () => {
    
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                throw new Error(tryBlockError);
            });
    
            await expect(userDAO.getIsUserAuthenticated("testUser", "password")).rejects.toThrowError(tryBlockError);
            expect(db.get).toHaveBeenCalledTimes(1);

        });
        
    });
  
    describe("createUser", () => {
  
        test("It should resolve with true if everything goes well", async () => {

            jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })

            jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });

            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
        });

        test("It should throw DB Error (db.run)", async () => {
        
            jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })

            jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DBerr));
                return {} as Database
            })
    
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(DBerr);
            expect(db.run).toHaveBeenCalledTimes(1);
        });

        
        test("It should throw an UserAlreadyExistsError if the username already exists", async () => {
        
            jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })

            jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("UNIQUE constraint failed: Users.username"));
                return {} as Database
            })

            await expect(userDAO.createUser(testCustomer.username, testCustomer.name, testCustomer.surname, "password", testCustomer.role)).rejects.toThrowError(UserAlreadyExistsError);
            expect(db.run).toHaveBeenCalledTimes(1);
        });

        test("It should throw an error if throw in the try block", async () => {

            jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            });

            jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            });

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error(tryBlockError);
            });

            await expect(userDAO.createUser(testCustomer.username, testCustomer.name, testCustomer.surname, "password", testCustomer.role)).rejects.toThrowError(tryBlockError);
            expect(db.run).toHaveBeenCalledTimes(1);

        });

    });

    describe("getUsers", () => {
  
        test("It should resolve with an array of User if everything goes well", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [userRow]);
                return {} as Database
            });

            const result = await userDAO.getUsers();
            expect(result).toEqual([testCustomer]);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should resolve with an empty array of User if there are no users", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database
            });

            const result = await userDAO.getUsers();
            expect(result).toEqual([]);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should throw DB Error (db.all)", async () => {
        
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DBerr));
                return {} as Database
            });
    
            await expect(userDAO.getUsers()).rejects.toThrow(DBerr);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should throw an error if throw in the try block", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw new Error(tryBlockError);
            });

            await expect(userDAO.getUsers()).rejects.toThrowError(tryBlockError);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

    });

    describe("getUsersByRole", () => {
  
        test("It should resolve with an array of User if everything goes well", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [userRow]);
                return {} as Database
            });

            const result = await userDAO.getUsersByRole("Customer");
            expect(result).toEqual([testCustomer]);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should resolve with an empty array of User if there are no users with the specified role", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database
            });

            const result = await userDAO.getUsersByRole("Customer");
            expect(result).toEqual([]);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should throw DB Error (db.all)", async () => {
        
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DBerr));
                return {} as Database
            });
    
            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow(DBerr);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        test("It should throw an error if throw in the try block", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw new Error(tryBlockError);
            });

            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrowError(tryBlockError);
            expect(db.all).toHaveBeenCalledTimes(1);

        });

        describe("getUserByUsername", () => {
  
            test("It should resolve with an User if everything goes well", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });
    
                const result = await userDAO.getUserByUsername(testCustomer.username);
                expect(result).toEqual(testCustomer);
                expect(db.get).toHaveBeenCalledTimes(1);
    
            });

            
            test("It should throw an UserNotFoundError if the user doesn't exist", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, undefined);
                    return {} as Database
                });
    
                await expect(userDAO.getUserByUsername(testCustomer.username)).rejects.toThrow(UserNotFoundError);
                expect(db.get).toHaveBeenCalledTimes(1);
    
            });

            test("It should throw DB Error (db.get)", async () => {
        
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
        
                await expect(userDAO.getUserByUsername(testCustomer.username)).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
    
            });
    

            test("It should throw an error if throw in the try block", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error(tryBlockError);
                });
    
                await expect(userDAO.getUserByUsername(testCustomer.username)).rejects.toThrowError(tryBlockError);
                expect(db.get).toHaveBeenCalledTimes(1);
    
            });

        });
        
        describe("deleteUser", () => {
  
            test("It should resolve with true if the user is deleted and it has carts in the database", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}]);
                    return {} as Database
                });

                //per cancellare i prodotti nei carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });

                //per cancellare i carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });

                //per cancellare le review dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });

                //per effettivamente cancellare lo user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });
    
                const result = await userDAO.deleteUser(testCustomer, "usernameTest");
                expect(result).toBe(true);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(4);

            });

            test("It should resolve with true if the user is deleted and it doesn't have carts in the database", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                //per cancellare le review dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });

                //per effettivamente cancellare lo user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                });
    
                const result = await userDAO.deleteUser(testCustomer, "usernameTest");
                expect(result).toBe(true);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (sixth db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                //per cancellare le review dello user da eliminare
                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (fifth db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                //per cancellare le review dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(1);

            });

            test("It should throw DB Error (fourth db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}]);
                    return {} as Database
                });

                //per cancellare i prodotti nei carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(4);

            });

            test("It should throw DB Error (third db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}]);
                    return {} as Database
                });

                //per cancellare i prodotti nei carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(3);

            });

            test("It should throw DB Error (second db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}]);
                    return {} as Database
                });

                //per cancellare i prodotti nei carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (first db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}]);
                    return {} as Database
                });

                //per cancellare i prodotti nei carrelli dello user da eliminare
                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(1);

            });

            test("It should throw DB Error (db.all)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                });

                //per ritornare gli id dei carrelli dello user da eliminare
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            
            test("It should throw an UserIsAdminError if the user to delete is an Admin", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, adminRow);
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testAdmin, adminRow.username)).rejects.toThrow(UserIsAdminError);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(0);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            
            test("It should throw an UserNotFoundError if the user to delete doesn't exist", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, undefined);
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testAdmin, adminRow.username)).rejects.toThrow(UserNotFoundError);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(0);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            test("It should throw DB Error (db.get)", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(0);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            test("It should throw an error if throw in the try block", async () => {
    

                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error(tryBlockError);
                });
    
                await expect(userDAO.deleteUser(testCustomer, "usernameTest")).rejects.toThrowError(tryBlockError);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.all).toHaveBeenCalledTimes(0);
                expect(db.run).toHaveBeenCalledTimes(0);
    
            });

        })
        
        describe("deleteAll", () => {
  
            test("It should resolve with true if everything goes well and users to delete have carts", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}, {cart_id: "3"}]);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                })

                const result = await userDAO.deleteAll();
                expect(result).toEqual(true);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(4);

            });

            test("It should resolve with true if everything goes well and users to delete don't have carts", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                })

                const result = await userDAO.deleteAll();
                expect(result).toEqual(true);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (sixth db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (fifth db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(1);

            });

            test("It should throw DB Error (forth db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}, {cart_id: "3"}]);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(4);

            });

            test("It should throw DB Error (third db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}, {cart_id: "3"}]);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(3);

            });

            test("It should throw DB Error (second db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}, {cart_id: "3"}]);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(2);

            });

            test("It should throw DB Error (first db.run)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{cart_id: "1"}, {cart_id: "2"}, {cart_id: "3"}]);
                    return {} as Database
                });

                jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(1);

            });

            test("It should throw DB Error (second db.all)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [userRow]);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                });

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            test("It should resolve with true if there aren't non-Admin users to delete", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database
                })

                const result = await userDAO.deleteAll();
                expect(result).toEqual(true);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            test("It should throw DB Error (first db.all)", async () => {
    
                jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                await expect(userDAO.deleteAll()).rejects.toThrow(DBerr);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

            test("It should throw an error if throw in the try block", async () => {
    
                jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    throw new Error(tryBlockError);
                });
    
                await expect(userDAO.deleteAll()).rejects.toThrowError(tryBlockError);
                expect(db.all).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

        });

        describe("updateUserInfo", () => {
  
            test("It should resolve with an user object if everything goes well", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                })

                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                })

                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                })
                
                const result = await userDAO.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username);
                expect(result).toEqual(testCustomer);
                expect(db.get).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(1);

            });

            test("It should throw DB Error (second db.get)", async () => {
    
                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                }).mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })

                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username)).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(2);
                expect(db.run).toHaveBeenCalledTimes(1);
                
            });

            test("It should throw DB Error (db.run)", async () => {
    
                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, userRow);
                    return {} as Database
                })

                jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username)).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(1);
                
            });

            
            test("It should throw an UnauthorizedUserError if you are trying to update an Admin", async () => {
    
                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, adminRow);
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(userAdminRow, testAdmin.name, testAdmin.surname, testAdmin.address, testAdmin.birthdate, testAdmin.username)).rejects.toThrow(UnauthorizedUserError);
                
            });

            
            test("It should throw an UserNotAdminError if you are trying to update an Admin", async () => {
    
                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, adminRow);
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(testCustomer, testAdmin.name, testAdmin.surname, testAdmin.address, testAdmin.birthdate, testAdmin.username)).rejects.toThrow(UserNotAdminError);
                
            });

            
            test("It should throw an UserNotFoundError if you are trying to update an Admin", async () => {
    
                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, undefined);
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(testCustomer, testAdmin.name, testAdmin.surname, testAdmin.address, testAdmin.birthdate, testAdmin.username)).rejects.toThrow(UserNotFoundError);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);
                
            })

            test("It should throw DB Error (first db.get)", async () => {

                jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error(DBerr));
                    return {} as Database
                })
                
                await expect(userDAO.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username)).rejects.toThrow(DBerr);
                expect(db.get).toHaveBeenCalledTimes(1);
                expect(db.run).toHaveBeenCalledTimes(0);
                
            });  
            
            test("It should throw an error if throw in the try block", async () => {
    
                jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error(tryBlockError);
                });

                await expect(userDAO.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username)).rejects.toThrowError(tryBlockError);
                expect(db.all).toHaveBeenCalledTimes(0);
                expect(db.run).toHaveBeenCalledTimes(0);

            });

        })
        

    });

})


