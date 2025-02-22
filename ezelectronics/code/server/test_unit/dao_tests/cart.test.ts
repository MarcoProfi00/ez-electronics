import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import db from "../../src/db/db"
import { Database } from "sqlite3"

import CartDAO from "../../src/dao/cartDAO"

import * as cartErrors from "../../src/errors/cartError"
import * as productErrors from "../../src/errors/productError"

import { Category } from "../../src/components/product"
import { Cart, ProductInCart } from "../../src/components/cart"
import { User, Role } from "../../src/components/user"

jest.mock("../../src/db/db.ts")

let testCartUnpaidEmpty = new Cart("test", false, null, 0, []);
let testCartUnpaid = new Cart("test", false, null, 1400, [new ProductInCart("iphone13", 1, Category.SMARTPHONE, 850), new ProductInCart("prova", 1, Category.APPLIANCE, 450), new ProductInCart("AcerAspire5", 1, Category.LAPTOP, 100)]);

let testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

describe("Cart DAO Unit Tests", () => {
    describe("getCurrentCart method", () => {
        describe("Resolve test cases", () => {
            test("Should return the an unpaid empty cart (cart not already present in the DB)", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, undefined);
                    return {} as Database;
                });

                const result = await cartDAO.getCurrentCart(testUser.username);

                expect(mockDBGet).toHaveBeenCalled();
                expect(result).toEqual(testCartUnpaidEmpty);

                mockDBGet.mockRestore();
            });

            test("Should return the an unpaid empty cart (cart already present in the DB)", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 0
                    });
                    return {} as Database;
                });

                const result = await cartDAO.getCurrentCart(testUser.username);

                expect(mockDBGet).toHaveBeenCalled();
                expect(result).toEqual(testCartUnpaidEmpty);

                mockDBGet.mockRestore();
            });

            test("Should return the current unpaid cart (not empty)", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "cart_id": 1,
                                "model": "iphone13",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "prova",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "model": "iphone13",
                                "category": "Smartphone",
                                "quantity": 1,
                                "sellingPrice": 850
                            },
                            {
                                "model": "prova",
                                "category": "Appliance",
                                "quantity": 1,
                                "sellingPrice": 450
                            },
                            {
                                "model": "AcerAspire5",
                                "category": "Laptop",
                                "quantity": 1,
                                "sellingPrice": 100
                            }
                        ]);
                        return {} as Database;
                    });

                const result = await cartDAO.getCurrentCart(testUser.username);

                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBAll).toHaveBeenCalled();
                expect(result).toEqual(testCartUnpaid);

                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            test("Should reject if the first query (get unpaid cart) throws an error", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(Error("DB Error"), undefined);
                    return {} as Database;
                });

                await expect(cartDAO.getCurrentCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();

                mockDBGet.mockRestore();
            });

            test("Should reject if the second query (get products of the unpaid cart) throws an error", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    callback(Error("DB Error"), undefined);
                    return {} as Database;
                });

                await expect(cartDAO.getCurrentCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBAll).toHaveBeenCalled();

                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });

            test("Should reject if the third query (get products info of the unpaid cart) throws an error", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "cart_id": 1,
                                "model": "iphone13",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "prova",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(Error("DB Error"), undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.getCurrentCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBAll).toHaveBeenCalledTimes(2);

                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                })

                await expect(cartDAO.getCurrentCart(testUser.username)).rejects.toThrowError("Generic error");
                expect(mockDBGet).toHaveBeenCalledTimes(1);

                mockDBGet.mockRestore();
            });
        });
    });

    describe("addToCurrentCart method", () => {
        describe("Resolved test cases", () => {
            test("It should return true if the product is added to the current cart(cart and product already present in the DB with quantity >= 1 and paid = 0)", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null,
                            {
                                "cartId": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        );
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })

                const result = await cartDAO.addToCurrentCart(testUser.username, "AcerAspire5");
                expect(result).toBe(true);
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();

            });
            test("It should return true if the product is added to the current cart(cart already present in the DB but product not present and paid = 0)", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                const result = await cartDAO.addToCurrentCart(testUser.username, "AcerAspire5");
                expect(result).toBe(true);
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("It should return true if the product is added to the current cart(cart not paid not present in the DB)", async () => {

                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback.call({ lastID: 1 }, null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    });

                const result = await cartDAO.addToCurrentCart(testUser.username, "AcerAspire5");
                expect(result).toBe(true);
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });
        });

        describe("Rejected test cases", () => {
            test("Should reject if the fourth update query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null,
                            {
                                "cartId": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        );
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });
                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the sixth select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null,
                            {
                                "cartId": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        );
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;

                    });
                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the third update query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null,
                            {
                                "cartId": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        );
                        return {} as Database;
                    });
                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the second update query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the fifth select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    });


                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the third insert query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the fourth select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cartId": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
            });

            test("Should reject if the first update query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "sellingPrice": 100
                        });
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback.call({ lastID: 1 }, null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    })

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the third select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;

                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback.call({ lastID: 1 }, null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })


                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the second insert query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, null);
                        return {} as Database;
                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback.call({ lastID: 1 }, null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    })

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the first insert query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the second select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "quantity": 1,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
            });

            test("Should reject if the first select query of the method fails", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        const error = new Error("DB Error");
                        callback(error, undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("DB Error");
                mockDBGet.mockRestore();
            });

            test("Should reject if the product exist but the quantity is 0", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null,
                            {
                                "quantity": 0
                            }
                        );
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5"))
                    .rejects.
                    toThrowError(productErrors.EmptyProductStockError);
                mockDBGet.mockRestore();
            });

            test("Should reject if the product does not exist", async () => {
                const cartDAO = new CartDAO();
                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5"))
                    .rejects
                    .toThrow(productErrors.ProductNotFoundError);
                mockDBGet.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                })

                await expect(cartDAO.addToCurrentCart(testUser.username, "AcerAspire5")).rejects.toThrowError("Generic error");
                expect(mockDBGet).toHaveBeenCalledTimes(1);

                mockDBGet.mockRestore();
            });
        });
    });

    describe("checkoutCart method", () => {
        describe("Resolve test cases", () => {
            test("Should resolve true if the cart checkout is successful", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "cart_id": 1,
                                "model": "iphone13",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "prova",
                                "quantity": 1
                            },
                            {
                                "cart_id": 1,
                                "model": "AcerAspire5",
                                "quantity": 1
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "quantity": 1
                            },
                            {
                                "quantity": 1
                            },
                            {
                                "quantity": 1
                            }
                        ]);
                        return {} as Database;
                    });

                const mockDBExec = jest.spyOn(db, "exec")
                    .mockImplementationOnce((sql, callback) => {
                        callback?.call(null, null);
                        return {} as Database;
                    });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementation((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    });

                const result = await cartDAO.checkoutCart(testUser.username);

                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBAll).toHaveBeenCalled();
                expect(mockDBRun).toHaveBeenCalled();
                expect(mockDBExec).toHaveBeenCalled();
                expect(result).toEqual(true);

                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
                mockDBExec.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            describe("First query (get unpaid cart)", () => {
                test("Should reject if the first query (get unpaid cart) throws an error", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(Error("DB Error"), undefined);
                        return {} as Database;
                    });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("DB Error");
                    expect(mockDBGet).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                });

                test("Should reject if the first query (get unpaid cart) does not find an unpaid cart", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError(cartErrors.CartNotFoundError);
                    expect(mockDBGet).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                });
            });

            describe("Second query (get products of the unpaid cart)", () => {
                test("Should reject if the second query (get products of the unpaid cart) throws an error", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                        callback(Error("DB Error"), undefined);
                        return {} as Database;
                    });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("DB Error");
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                });

                test("Should reject if the second query (get products of the unpaid cart) finds an empty cart", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                        callback(null, []);
                        return {} as Database;
                    });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError(cartErrors.EmptyCartError);
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                });
            });

            describe("Third query (get the disponibility of the products)", () => {
                test("Should reject if the third query (get the disponibility of the products) throws an error", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "cart_id": 1,
                                    "model": "iphone13",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "prova",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "AcerAspire5",
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        })
                        .mockImplementationOnce((sql, params, callback) => {
                            const error = new Error("DB Error");
                            callback(error, undefined);
                            return {} as Database;
                        });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("DB Error");
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalledTimes(2);

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                });

                test("Should reject if the third query (get the disponibility of the products) finds a product with disponibility 0", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "cart_id": 1,
                                    "model": "iphone13",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "prova",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "AcerAspire5",
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        })
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "quantity": 0
                                },
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError(productErrors.EmptyProductStockError);
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalledTimes(2);

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                });

                test("Should reject if the third query (get the disponibility of the products) finds a product with disponibility < quantity in the cart", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 2,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 2250
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "cart_id": 1,
                                    "model": "iphone13",
                                    "quantity": 2
                                },
                                {
                                    "cart_id": 1,
                                    "model": "prova",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "AcerAspire5",
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        })
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError(productErrors.LowProductStockError);
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalledTimes(2);

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                });
            });

            describe("Fourth query (update the avilability of the products)", () => {
                test("Should reject if the fourth query (update the avilability of the products) throws an error", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "cart_id": 1,
                                    "model": "iphone13",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "prova",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "AcerAspire5",
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        })
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        });

                    const mockDBExec = jest.spyOn(db, "exec")
                        .mockImplementationOnce((sql, callback) => {
                            callback?.call(null, Error("DB Error"));
                            return {} as Database;
                        });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("DB Error");
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalled();
                    expect(mockDBExec).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                    mockDBExec.mockRestore();
                }, 10000);
            });

            describe("Fifth query (pay the cart)", () => {
                test("Should reject if the fifth query (pay the cart) throws an error", async () => {
                    const cartDAO = new CartDAO();

                    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                        callback(null, {
                            "cart_id": 1,
                            "username": testUser.username,
                            "paid": 0,
                            "paymentDate": null,
                            "total": 1400
                        });
                        return {} as Database;
                    });

                    const mockDBAll = jest.spyOn(db, "all")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "cart_id": 1,
                                    "model": "iphone13",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "prova",
                                    "quantity": 1
                                },
                                {
                                    "cart_id": 1,
                                    "model": "AcerAspire5",
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        })
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(null, [
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                },
                                {
                                    "quantity": 1
                                }
                            ]);
                            return {} as Database;
                        });

                    const mockDBExec = jest.spyOn(db, "exec")
                        .mockImplementationOnce((sql, callback) => {
                            callback?.call(null, null);
                            return {} as Database;
                        });

                    const mockDBRun = jest.spyOn(db, "run")
                        .mockImplementationOnce((sql, params, callback) => {
                            callback(Error("DB Error"));
                            return {} as Database;
                        });

                    await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("DB Error");
                    expect(mockDBGet).toHaveBeenCalled();
                    expect(mockDBAll).toHaveBeenCalled();
                    expect(mockDBRun).toHaveBeenCalled();
                    expect(mockDBExec).toHaveBeenCalled();

                    mockDBGet.mockRestore();
                    mockDBAll.mockRestore();
                    mockDBRun.mockRestore();
                    mockDBExec.mockRestore();
                });
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                })

                await expect(cartDAO.checkoutCart(testUser.username)).rejects.toThrowError("Generic error");
                expect(mockDBGet).toHaveBeenCalledTimes(1);

                mockDBGet.mockRestore();
            });
        });
    });

    describe("getCostumerCarts method", () => {
        describe("Resolve test cases", () => {
            test("Should resolve an empty array of carts if the user has no paid carts in the history", async () => {
                const cartDAO = new CartDAO();
                const cart: Cart[] = [];
                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database;
                });

                const result = await cartDAO.getCustomerCarts(testUser.username);
                expect(result).toEqual(cart);
                expect(mockDBAll).toHaveBeenCalled();
                mockDBAll.mockRestore();
            });

            test("Should resolve an array of carts with products in different categories", async () => {
                const cartDAO = new CartDAO();
                const carts = [
                    new Cart(testUser.username, true, '2023-01-01', 300, [
                        new ProductInCart('Model1', 2, Category.SMARTPHONE, 100),
                        new ProductInCart('Model2', 1, Category.LAPTOP, 100),
                        new ProductInCart('Model3', 1, Category.APPLIANCE, 100)
                    ])
                ];

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get paid carts
                        callback(null, [
                            {
                                cart_id: 1,
                                username: testUser.username,
                                paid: 1,
                                paymentDate: '2023-01-01',
                                total: 300,

                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get products in the cart
                        callback(null, [
                            { model: 'Model1', category: 'Smartphone', quantity: 2, sellingPrice: 100 },
                            { model: 'Model2', category: 'Laptop', quantity: 1, sellingPrice: 100 },
                            { model: 'Model3', category: 'Appliance', quantity: 1, sellingPrice: 100 }
                        ]);
                        return {} as Database;
                    });

                const result = await cartDAO.getCustomerCarts(testUser.username);
                expect(result).toEqual(carts);
                expect(mockDBAll).toHaveBeenCalledTimes(2);
                mockDBAll.mockRestore();
            });


        });

        describe("Reject test cases", () => {
            test("Should reject if there is an error with the first select query of the method", async () => {
                const cartDAO = new CartDAO();
                const mockError = new Error("DB error");

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(mockError, undefined);
                    return {} as Database;
                });

                await expect(cartDAO.getCustomerCarts(testUser.username)).rejects.toThrow(mockError);
                expect(mockDBAll).toHaveBeenCalled();
                mockDBAll.mockRestore();
            });

            test("Should reject if there is an error with the second select query of the method", async () => {
                const cartDAO = new CartDAO();
                const mockError = new Error("DB error");

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get paid carts
                        callback(null, [
                            {
                                cart_id: 1,
                                username: testUser.username,
                                paid: 1,
                                paymentDate: '2023-01-01',
                                total: 200,

                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get products in the cart
                        callback(mockError, undefined);
                        return {} as Database;
                    });

                await expect(cartDAO.getCustomerCarts(testUser.username)).rejects.toThrow(mockError);
                expect(mockDBAll).toHaveBeenCalledTimes(2);
                mockDBAll.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                });

                await expect(cartDAO.getCustomerCarts(testUser.username)).rejects.toThrowError("Generic error");
                expect(mockDBAll).toHaveBeenCalledTimes(1);

                mockDBAll.mockRestore();
            });
        });

    });

    describe("removeProductFromCart method", () => {
        describe("Resolve test cases", () => {
            test("Should resolve true if the product is removed successfully and there's only one instance in the cart", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the product
                        callback(null,
                            {
                                model: 'AcerAspire5',
                                category: 'Smartphone',
                                arrivalDate: '2023-01-01',
                                sellingPrice: 100,
                                quantity: 1,
                                details: 'good'
                            }
                        );
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the unpaid cart
                        callback(null,
                            {
                                cart_id: 1,
                                username: testUser.username,
                                paid: 0,
                                paymentDate: null,
                                total: 200,
                            }
                        );
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the product quantity in the cart
                        callback(null, {
                            quantity: 1
                        }
                        );
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    // Mock query to check products in the cart
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 1
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock delete product from cart
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock update cart total
                        callback(null);
                        return {} as Database;
                    });

                const result = await cartDAO.removeProductFromCart(testUser.username, "AcerAspire5");
                expect(result).toBe(true);
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should resolve true if the product is removed successfully and there are multiple instances in the cart", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the product
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the unpaid cart
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 300,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock query to get the product quantity in the cart
                        callback(null, {
                            quantity: 3
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    // Mock query to check products in the cart
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 3
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock update product quantity in cart
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        // Mock update cart total
                        callback(null);
                        return {} as Database;
                    });

                const result = await cartDAO.removeProductFromCart(testUser.username, "AcerAspire5");
                expect(result).toBe(true);
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            test("Should reject if there's an error in the first select query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("DB error"));
                    return {} as Database;
                });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
            });
            test("Should reject if product not found", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                    callback(null, null);
                    return {} as Database;
                });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow(productErrors.ProductNotFoundError);
                mockDBGet.mockRestore();
            });

            test("Should reject if there's an error in the second select query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(new Error("DB error"), null);
                        return {} as Database;
                    });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
            });
            test("Should reject if no unpaid cart is found for the user", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, null);
                        return {} as Database;
                    });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow(cartErrors.CartNotFoundError);
                mockDBGet.mockRestore();
            });
            test("Should reject if there's an error in the third select query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("DB error"), undefined);
                    return {} as Database;
                });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });

            test("Should reject if the cart is empty", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, []);
                    return {} as Database;
                });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow(cartErrors.CartNotFoundError);
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });

            test("Should reject if there's an error in the fourth select query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(new Error("DB error"), undefined);
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 1
                    }]);
                    return {} as Database;
                });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });
            test("Should reject if there's an error in the fourth select query of the method and there are no products in the cart", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, undefined);
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 1
                    }]);
                    return {} as Database;
                });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow(cartErrors.ProductNotInCartError);
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
            });
            test("Should reject if there's an error in the first delete query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            quantity: 1
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 1
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("DB error"));
                    return {} as Database;
                });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });
            test("Should reject if there's an error in the first update query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            quantity: 1
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 1
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database;
                })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(new Error("DB error"));
                        return {} as Database;
                    });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if there's an error in the second update query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            quantity: 2
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 2
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(new Error("DB error"));
                    return {} as Database;
                });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if there's an error in the third update query of the method", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            model: 'AcerAspire5',
                            category: 'Smartphone',
                            arrivalDate: '2023-01-01',
                            sellingPrice: 100,
                            quantity: 1,
                            details: 'good'
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            cart_id: 1,
                            username: testUser.username,
                            paid: 0,
                            paymentDate: null,
                            total: 200,
                        });
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, {
                            quantity: 2
                        });
                        return {} as Database;
                    });

                const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                    callback(null, [{
                        cart_id: 1,
                        model: 'AcerAspire5',
                        quantity: 2
                    }]);
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                    callback(null);
                    return {} as Database;
                })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(new Error("DB error"));
                        return {} as Database;
                    });



                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrow("DB error");
                mockDBGet.mockRestore();
                mockDBAll.mockRestore();
                mockDBRun.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                });

                await expect(cartDAO.removeProductFromCart(testUser.username, "AcerAspire5")).rejects.toThrowError("Generic error");
                expect(mockDBGet).toHaveBeenCalledTimes(1);

                mockDBGet.mockRestore();
            });
        });

    });

    describe("clearCart method", () => {
        describe("Resolve test cases", () => {
            test("Should resolve true if the cart is successfully cleared", async () => {
                const cartDao = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(null);
                    return {} as Database;
                });

                const result = await cartDao.clearCart(testUser.username);

                expect(result).toEqual(true);
                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBRun).toHaveBeenCalled();

                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            test("Should reject if the first query (get unpaid cart) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(Error("DB Error"), undefined);
                    return {} as Database;
                });

                await expect(cartDao.clearCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();

                mockDBGet.mockRestore();
            });

            test("Should reject if the first query (get unpaid cart) does not find an unpaid cart", async () => {
                const cartDao = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, undefined);
                    return {} as Database;
                });

                await expect(cartDao.clearCart(testUser.username)).rejects.toThrowError(cartErrors.CartNotFoundError);
                expect(mockDBGet).toHaveBeenCalled();

                mockDBGet.mockRestore();
            });

            test("Should reject if the second query (clear cart) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    callback(Error("DB Error"));
                    return {} as Database;
                });

                await expect(cartDao.clearCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBRun).toHaveBeenCalled();

                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("Should reject if the third query (set the total of the unpaid cart to 0) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    callback(null, {
                        "cart_id": 1,
                        "username": testUser.username,
                        "paid": 0,
                        "paymentDate": null,
                        "total": 1400
                    });
                    return {} as Database;
                });

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(Error("DB Error"));
                        return {} as Database;
                    });

                await expect(cartDao.clearCart(testUser.username)).rejects.toThrowError("DB Error");
                expect(mockDBGet).toHaveBeenCalled();
                expect(mockDBRun).toHaveBeenCalled();

                mockDBGet.mockRestore();
                mockDBRun.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                });

                await expect(cartDAO.clearCart(testUser.username)).rejects.toThrowError("Generic error");
                expect(mockDBGet).toHaveBeenCalledTimes(1);

                mockDBGet.mockRestore();
            });
        });
    });

    describe("deleteAllCarts method", () => {
        describe("Resolve test cases", () => {
            test("Should return true if all the carts are deleted", async () => {
                const cartDao = new CartDAO();

                const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
                    callback(null);
                    return {} as Database;
                });

                const result = await cartDao.deleteAllCarts();

                expect(result).toEqual(true);
                expect(mockDBRun).toHaveBeenCalled();

                mockDBRun.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            test("Should reject if the first query (delete all the products of all the carts) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
                    callback(Error("DB Error"));
                    return {} as Database;
                });

                await expect(cartDao.deleteAllCarts()).rejects.toThrowError("DB Error");
                expect(mockDBRun).toHaveBeenCalled();

                mockDBRun.mockRestore();
            });

            test("Should reject if the second query (delete all the carts) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBRun = jest.spyOn(db, "run")
                    .mockImplementationOnce((sql, callback) => {
                        callback(null);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, callback) => {
                        callback(Error("DB Error"));
                        return {} as Database;
                    });

                await expect(cartDao.deleteAllCarts()).rejects.toThrowError("DB Error");
                expect(mockDBRun).toHaveBeenCalled();

                mockDBRun.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                });

                await expect(cartDAO.deleteAllCarts()).rejects.toThrowError("Generic error");
                expect(mockDBRun).toHaveBeenCalledTimes(1);

                mockDBRun.mockRestore();
            });
        });
    });

    describe("getAllCarts method", () => {
        describe("Resolve test cases", () => {
            test("Should resolve in an empty array of carts if there are no carts", async () => {
                const cartDao = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                    callback(null, []);
                    return {} as Database;
                });

                const result = await cartDao.getAllCarts();
                expect(result).toEqual([]);
                expect(mockDBAll).toHaveBeenCalled();

                mockDBAll.mockRestore();
            });

            test("Should resolve in an array of carts", async () => {
                const cartDao = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, callback) => {
                        callback(null, [
                            {
                                "cart_id": 1,
                                "username": testUser.username,
                                "paid": 0,
                                "paymentDate": null,
                                "total": 1400
                            },
                            {
                                "cart_id": 2,
                                "username": testUser.username,
                                "paid": 0,
                                "paymentDate": null,
                                "total": 0
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, [
                            {
                                "model": "iphone13",
                                "category": "Smartphone",
                                "quantity": 1,
                                "sellingPrice": 850
                            },
                            {
                                "model": "prova",
                                "category": "Appliance",
                                "quantity": 1,
                                "sellingPrice": 450
                            },
                            {
                                "model": "AcerAspire5",
                                "category": "Laptop",
                                "quantity": 1,
                                "sellingPrice": 100
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(null, []);
                        return {} as Database;
                    });

                const result = await cartDao.getAllCarts();
                expect(result).toEqual([testCartUnpaid, testCartUnpaidEmpty]);
                expect(mockDBAll).toHaveBeenCalled();

                mockDBAll.mockRestore();
            });
        });

        describe("Reject test cases", () => {
            test("Should reject if the first query (get all the carts) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                    callback(Error("DB Error"), undefined);
                    return {} as Database;
                });

                await expect(cartDao.getAllCarts()).rejects.toThrowError("DB Error");
                expect(mockDBAll).toHaveBeenCalled();

                mockDBAll.mockRestore();
            });

            test("Should reject if the second query (get products of the unpaid cart) throws an error", async () => {
                const cartDao = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all")
                    .mockImplementationOnce((sql, callback) => {
                        callback(null, [
                            {
                                "cart_id": 1,
                                "username": testUser.username,
                                "paid": 0,
                                "paymentDate": null,
                                "total": 1400
                            },
                            {
                                "cart_id": 2,
                                "username": testUser.username,
                                "paid": 0,
                                "paymentDate": null,
                                "total": 0
                            }
                        ]);
                        return {} as Database;
                    })
                    .mockImplementationOnce((sql, params, callback) => {
                        callback(Error("DB Error"), undefined);
                        return {} as Database;
                    });

                await expect(cartDao.getAllCarts()).rejects.toThrowError("DB Error");
                expect(mockDBAll).toHaveBeenCalled();

                mockDBAll.mockRestore();
            });

            test("It should reject if an generic error is thrown in the try block", async () => {
                const cartDAO = new CartDAO();

                const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                    throw new Error("Generic error");
                });

                await expect(cartDAO.getAllCarts()).rejects.toThrowError("Generic error");
                expect(mockDBAll).toHaveBeenCalledTimes(1);

                mockDBAll.mockRestore();
            });
        });
    });
});