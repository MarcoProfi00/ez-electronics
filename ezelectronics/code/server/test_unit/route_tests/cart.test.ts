import { test, expect, jest, describe } from "@jest/globals"

import request from 'supertest'
import { app } from "../../index"

import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"

import CartController from "../../src/controllers/cartController"
import { Cart, ProductInCart } from "../../src/components/cart"
import { User, Role } from "../../src/components/user"
import { Category } from "../../src/components/product"

const baseURL = "/ezelectronics";

let testCart1 = new Cart("test", false, "2024-06-07", 0, []);
let testCart2 = new Cart("test", true, "2024-06-04", 850, [new ProductInCart("iphone13", 1, Category.SMARTPHONE, 850)]);
let testCart3 = new Cart("test_all", true, "2024-06-03", 450, [new ProductInCart("xiaomiMi10", 1, Category.SMARTPHONE, 450)]);

let testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

// Mock dependencies
jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/cartController");

describe("Cart Routes Unit Tests", () => {
    describe("GET /carts", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(testCart1);

            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(200);
            expect(CartController.prototype.getCart).toHaveBeenCalled();
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(response.body).toEqual(testCart1);
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "getCart").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).get(baseURL + "/carts");

            expect(response.status).toBe(503);
        });
    });

    describe("POST /carts", () => {
        test("It should return a 200 success code", async () => {
            const bodyRequest = { model: "prova" };

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);

            const response = await request(app).post(baseURL + "/carts").send(bodyRequest);

            expect(response.status).toBe(200);
            expect(CartController.prototype.addToCart).toHaveBeenCalled();
            expect(CartController.prototype.addToCart).toHaveBeenCalledWith(testUser, bodyRequest.model);
        });

        test("It should fail if the body of the request (model) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid model");
                }),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + "/carts").send();

            expect(response.status).toBe(422);
        });

        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).post(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).post(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            const bodyRequest = { model: "prova" };

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).post(baseURL + "/carts").send(bodyRequest);

            expect(response.status).toBe(503);
        });
    });

    describe("PATCH /carts", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);

            const response = await request(app).patch(baseURL + "/carts").send();

            expect(response.status).toBe(200);
            expect(CartController.prototype.getCart).toHaveBeenCalled();
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(testUser);
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).patch(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).patch(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).patch(baseURL + "/carts").send();

            expect(response.status).toBe(503);
        });
    });

    describe("GET /carts/history", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue([testCart1, testCart2]);

            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(200);
            expect(CartController.prototype.getCart).toHaveBeenCalled();
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(response.body).toEqual([testCart1, testCart2]);
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).get(baseURL + "/carts/history");

            expect(response.status).toBe(503);
        });
    });

    describe("DELETE /carts/:model", () => {
        test("It should return a 200 success code", async () => {
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);

            const response = await request(app).delete(baseURL + "/carts/products/prova").send();

            expect(response.status).toBe(200);
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
            expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(testUser, "prova");
        });

        test("It should fail if the user is not logged", async () => {
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).delete(baseURL + "/carts/products/prova").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).delete(baseURL + "/carts/products/prova").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) })
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).delete(baseURL + "/carts/products/prova").send();

            expect(response.status).toBe(503);
        });
    });

    describe("DELETE /carts/current", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);

            const response = await request(app).delete(baseURL + "/carts/current").send();

            expect(response.status).toBe(200);
            expect(CartController.prototype.clearCart).toHaveBeenCalled();
            expect(CartController.prototype.clearCart).toHaveBeenCalledWith(testUser);
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).delete(baseURL + "/carts/current").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a customer", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).delete(baseURL + "/carts/current").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).delete(baseURL + "/carts/current").send();

            expect(response.status).toBe(503);
        });
    });

    describe("DELETE /carts", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);

            const response = await request(app).delete(baseURL + "/carts").send();

            expect(response.status).toBe(200);
            expect(CartController.prototype.clearCart).toHaveBeenCalled();
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).delete(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a admin or a manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 })
            });

            const response = await request(app).delete(baseURL + "/carts").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).delete(baseURL + "/carts").send();

            expect(response.status).toBe(503);
        });
    });

    describe("GET /carts/all", () => {
        test("It should return a 200 success code", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue([testCart1, testCart2, testCart3]);

            const response = await request(app).get(baseURL + "/carts/all").send();

            expect(response.status).toBe(200);
            expect(CartController.prototype.clearCart).toHaveBeenCalled();
            expect(response.body).toEqual([testCart1, testCart2, testCart3]);
        });

        test("It should fail if the user is not logged", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).get(baseURL + "/carts/all").send();

            expect(response.status).toBe(401);
        });

        test("It should fail if the user is not a admin or a manager", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 })
            });

            const response = await request(app).get(baseURL + "/carts/all").send();

            expect(response.status).toBe(401);
        });

        test("It should throw an error if the controller returns an error", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValue(new Error("CartController error"));

            const response = await request(app).get(baseURL + "/carts/all").send();

            expect(response.status).toBe(503);
        });
    });
});