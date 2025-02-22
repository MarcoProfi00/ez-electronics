import { test, expect, jest, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import { UnauthorizedUserError } from "../../src/errors/userError"
import exp from "constants"
import dayjs from "dayjs"
import { AuthRoutes, UserRoutes } from "../../src/routers/userRoutes"
const baseURL = "/ezelectronics"

let testUserAdmin = new User("test", "test", "test", Role.ADMIN, "", "")
let testUserCustomer = new User("testCustomer", "testCustomer", "testCustomer", Role.CUSTOMER, "", "")

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

describe("User Route Unit Test", () => {
    describe("POST /users", () => {
        test("It should return a 200 success code", async () => {
            const testUser = {
                username: "testUser",
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn()
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(UserController.prototype, "createUser").mockResolvedValue(true)

            const response = await request(app)
                .post(baseURL + "/users")
                .send(testUser)
            
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalled()
        })

        test("It should fail if the body of the request (username) is not string", async() => {
            const testUser = {
                username: 2, //username not valid
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid username")
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (username) is not valid (empty)", async() => {
            const testUser = {
                username: "", //username not valid
                name: "test",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => {
                        throw new Error("Invalid username")
                    })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (name) is not string", async() => {
            const testUser = {
                username: "test",
                name: 2,
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid name")
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (name) is not valid (empty)", async() => {
            const testUser = {
                username: "test",
                name: "",
                surname: "test",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => {
                        throw new Error("Invalid name")
                    })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (surname) is not string", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: 2,
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid surname")
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (surname) is not valid (empty)", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "",
                password: "test",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => {
                        throw new Error("Invalid surname")
                    })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (name) is not string", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: 2,
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid password")
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (password) is not valid (empty)", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "",
                role: "Customer"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => {
                        throw new Error("Invalid password")
                    })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (role) is not valid ", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "error"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => {
                            throw new Error("Invalid role")
                        })
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(422)
        })

        test("It should throw an error if the controller returns an error", async() => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn()
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(UserController.prototype, "createUser").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app).post(baseURL + "/users").send(testUser)
            expect(response.status).toBe(503)
        })
    })

    describe("GET /users", () => {
        test("It should return a 200 success code", async () => {
            const testUser1 = new User("test1", "test1", "test1", Role.MANAGER, "", "")
            const testUser2 = new User("test2", "test2", "test2", Role.CUSTOMER, "", "")

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValue([testUser1, testUser2])

            const response = await request(app)
                .get(baseURL + "/users")
                

            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([
                {username: "test1", name: "test1", surname: "test1", role: "Manager", address: "", birthdate: ""}, 
                {username: "test2", name: "test2", surname: "test2", role: "Customer", address: "", birthdate: ""}
            ])
        })

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })

            const response = await request(app)
                .get(baseURL + "/users")  

            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 })
            })

            const response = await request(app)
                .get(baseURL + "/users")  

            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "getUsers").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app)
                .get(baseURL + "/users")
                

            expect(response.status).toBe(503)
        })
    })

    describe("GET /users/roles/:role", () => {
        test("It should return a 200 success code", async () => {
            const testUser1 = new User("test1", "test1", "test1", Role.CUSTOMER, "", "")
            const testUser2 = new User("test2", "test2", "test2", Role.CUSTOMER, "", "")

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isIn: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValue([testUser1, testUser2])

            const response = await request(app)
                .get(baseURL + "/users/roles/Customer")
                

            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([
                {username: "test1", name: "test1", surname: "test1", role: "Customer", address: "", birthdate: ""}, 
                {username: "test2", name: "test2", surname: "test2", role: "Customer", address: "", birthdate: ""}
            ])
        })

        test("It should fail if the role for the request is not valid (not String or not Manager, Customer or Admin)", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid role")
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" })
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            const response = await request(app)
                .get(baseURL + "/users/roles/2") //lo chiamo con una stringa a caso
                

            expect(response.status).toBe(422)
        })

        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isIn: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })
            

            const response = await request(app)
                .get(baseURL + "/users/roles/Customer")
                

            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isIn: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin", status: 401 })
            })
            

            const response = await request(app)
                .get(baseURL + "/users/roles/Customer")
                

            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isIn: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app)
                .get(baseURL + "/users/roles/Customer")
                

            expect(response.status).toBe(503)
        })
    })

    describe("GET /users/:username", () => {
        test("It should return a 200 success code", async () => {
            const testUser1 = new User("test1", "test1", "test1", Role.CUSTOMER, "", "")

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })
        
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser1)

            const response = await request(app)
                .get(baseURL + `/users/test1`)
                

            expect(response.status).toBe(200)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalled()
            expect(response.body).toEqual({
                username: "test1", 
                name: "test1", 
                surname: "test1", 
                role: "Customer", 
                address: "", 
                birthdate: ""
            })
        })

        
        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })
                   
            const response = await request(app)
                .get(baseURL + "/users/test1")
                
            expect(response.status).toBe(401)
        })

        test("It should return a 401 unauthorized error if the user is not an admin", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserCustomer
                return next()
            })
    

            const response = await request(app)
                .get(baseURL + "/users/test1")
                

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                err: {
                    customMessage: "You cannot access the information of other users",
                    customCode: 401
                },
                status: 401
            });
        })

        test("It should throw an error if the controller returns an error", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app)
                .get(baseURL + "/users/test1")
                

            expect(response.status).toBe(503)
        })     
    })

    describe("DELETE /users/:username", () => {
        test("It should return a 200 success code", async() => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValue(true)

            const response = await request(app)
                .delete(baseURL + "/users/test1")

            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        })

        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })
                   
            const response = await request(app)
                .delete(baseURL + "/users/test1")
                
            expect(response.status).toBe(401)
        })

        test("It should return a 401 User Not Admin error if the user is not an admin", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserCustomer
                return next()
            })
    

            const response = await request(app)
                .delete(baseURL + "/users/test1")
                

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                err: {
                    customMessage: "This operation can be performed only by an admin",
                    customCode: 401
                },
                status: 401
            });
        })

        test("It should throw an error if the controller returns an error", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app)
                .delete(baseURL + "/users/test1")
                

            expect(response.status).toBe(503)
        })
    })

    describe("DELETE /users", () => {
        test("It should return a 200 success code", async() => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true)

            const response = await request(app)
                .delete(baseURL + "/users")

            expect(response.status).toBe(200)
            expect(UserController.prototype.deleteUser).toHaveBeenCalled()
        })

        test("It should fail if the user is not logged", async () => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })
                   
            const response = await request(app)
                .delete(baseURL + "/users")
                
            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin", async () => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })
                   
            const response = await request(app)
                .delete(baseURL + "/users")
                
            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async () => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                req.user = testUserAdmin
                return next()
            })

            jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValue(new Error("UserController Error"))

            const response = await request(app)
                .delete(baseURL + "/users")
                

            expect(response.status).toBe(503)
        })
    })

    describe("PATCH /users/:username", () => {
        test("It should return a 200 success code", async () => {
            let testUserUpdated = new User("test1", "testUpdated", "testUpdated", Role.CUSTOMER, "testUpdated", "2024-06-11");        
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                })),

                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => {
                            isISO8601: jest.fn()
                        })
                    }))
                }))
            }))
            
 
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserUpdated
                return next();
            });
        
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(testUserUpdated);
        
            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: "testUpdated",
                    surname: "testUpdated",
                    address: "testUpdated",
                    birthdate: "2024-06-11"
                });
        
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testUserUpdated);
        });

        test("It should fail if the body of request (name, surname, address) is not valid", async () => {
            let testUserUpdated = new User("test1", "testUpdated", "testUpdated", Role.CUSTOMER, "testUpdated", "2024-06-11");        
            jest.mock('express-validator', () => ({

                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => {
                            throw new Error("Invalid body values")
                        })
                    }))
                }))
            }))
            
 
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserUpdated
                return next();
            })
                
            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: 2, //value not valid
                    surname: 2, //value not valid
                    address: 2, //value not valid
                    birthdate: "2024-06-11"
                });
        
            expect(response.status).toBe(422);
        })

        test("It should fail if the body of request (birthDate) is not valid format", async () => {
            let testUserUpdated = new User("test1", "testUpdated", "testUpdated", Role.CUSTOMER, "testUpdated", "2024-06-11");        
            jest.mock('express-validator', () => ({

                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid birthDate format")
                })
            }))
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserUpdated
                return next();
            })
                
            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: "testUpdated", 
                    surname: "testUpdated", 
                    address: "testUpdated", 
                    birthdate: "11-06-2024" //formato non valido
                });
        
            expect(response.status).toBe(422);
        })
        
        test("It should return a 400 error if birthdate is in the future", async () => {
            const birthDateFuture = dayjs().add(1, 'day').format('YYYY-MM-DD')

            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockReturnThis(),
                    notEmpty: jest.fn().mockReturnThis()
                })),
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockReturnThis(),
                    notEmpty: jest.fn().mockReturnThis(),
                    isISO8601: jest.fn().mockReturnThis()
                }))
            }));

            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: "UpdatedName",
                    surname: "UpdatedSurname",
                    address: "UpdatedAddress",
                    birthdate: birthDateFuture
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "birthday cannot be in the future", status: 400 });
        });

        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockReturnThis(),
                    notEmpty: jest.fn().mockReturnThis()
                })),
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockReturnThis(),
                    notEmpty: jest.fn().mockReturnThis(),
                    isISO8601: jest.fn().mockReturnThis()
                }))
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: "UpdatedName",
                    surname: "UpdatedSurname",
                    address: "UpdatedAddress",
                    birthdate: "2024-06-11"
                });

            expect(response.status).toBe(401);
        })

        test("It should throw an error if the controller returns an error", async () => {
            let testUserUpdated = new User("test1", "testUpdated", "testUpdated", Role.CUSTOMER, "testUpdated", "2024-06-11");        
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn()
                    }))
                })),

                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockImplementation(() => {
                            isISO8601: jest.fn()
                        })
                    }))
                }))
            }))
            
 
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
        
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUserUpdated
                return next();
            });
        
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValue(new Error("UserController Error"));
        
            const response = await request(app)
                .patch(baseURL + "/users/test1")
                .send({
                    name: "testUpdated",
                    surname: "testUpdated",
                    address: "testUpdated",
                    birthdate: "2024-06-11"
                });
        
            expect(response.status).toBe(503);
        })
    })
})

/*let mockTestUser = new User("testUser", "test", "test", Role.CUSTOMER, "test", "2024-06-11")

describe("User Authentication Route Unit test", () => {
    describe("Route for login: POST /", () => {
        test("It should return a 200 success code for a valid login", async () => {
            const testUser = {
                username: "testUser",
                password: "test"
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        notEmpty: jest.fn().mockReturnThis()
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(AuthRoutes.prototype, )


        })
    })
})
    */