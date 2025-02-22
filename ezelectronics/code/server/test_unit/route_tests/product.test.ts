import { test, expect, jest, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import dayjs from "dayjs"
import ErrorHandler from "../../src/helper"
import Authenticator from "../../src/routers/auth"

import ProductController from "../../src/controllers/productController"
import { Product } from "../../src/components/product"
import { User, Role } from "../../src/components/user"
import { Category } from "../../src/components/product"


let testUser = new User("test", "test", "test", Role.ADMIN, "", "");
let baseURL = "/ezelectronics"

// Mock dependencies
jest.mock("../../src/routers/auth");
jest.mock("../../src/controllers/cartController");

describe("Product Route Unit Test", () => {
    describe("POST /products", () => {
        test("It should return a 200 success code", async () => {
            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 2,
                details: "This is a smartphone",
                sellingPrice: 200,
                arrivalDate: dayjs().format("YYYY-MM-DD")
            }

            //Mock di express-validator
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn().mockImplementation(() => ({
                                                isISO8601: jest.fn()
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            //Mock dei middleware e controller
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValue(undefined)

            const response = await request(app)
                .post(baseURL + "/products")
                .send(bodyRequest)

            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                bodyRequest.model,
                bodyRequest.category,
                bodyRequest.quantity,
                bodyRequest.details,
                bodyRequest.sellingPrice,
                bodyRequest.arrivalDate
            )
        })

        test("It should return a 400 error code if arrivalDate is after the current date", async() => {
            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 1,
                details: "details",
                sellingPrice: 100,
                arrivalDate: dayjs().add(1, 'day').format("YYYY-MM-DD") // Data futura
            }

            const response = await request(app)
                .post(baseURL + "/products")
                .send(bodyRequest);
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('arrivalDate cannot be in the future')
        })

        test("It should fail if the body of the request (model) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid model");
                }),
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (category) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => {
                            throw new Error("Invalid category")
                        })
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (quantity) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => {
                                throw new Error ("Invalid quantity")
                            })
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (details) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => {
                        throw new Error("Ivalid details")
                    })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (sellingPrice) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => {
                                        throw new Error("Invalid sellingPrice");
                                    })
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (arrivalDate) is not valid", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn().mockImplementation(() => {
                                                throw new Error("Invalid arrivalDate format")
                                            })
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            const response = await request(app).post(baseURL + "/products").send()
            expect(response.status).toBe(422)
        })
        
        test("It should return a 200 success code if the product not have arrivalDate", async () => {
            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 2,
                details: "This is a smartphone",
                sellingPrice: 200,
            }

            //Mock di express-validator
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn()
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            //Mock dei middleware e controller
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            });

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValue(undefined)

            const response = await request(app)
                .post(baseURL + "/products")
                .send(bodyRequest)

            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
                bodyRequest.model,
                bodyRequest.category,
                bodyRequest.quantity,
                bodyRequest.details,
                bodyRequest.sellingPrice,
                dayjs().format("YYYY-MM-DD")
            )
        })

        test("It should fail if the user is not logged", async () => {

            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 2,
                details: "This is a smartphone",
                sellingPrice: 200,
            }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn().mockImplementation(() => ({
                                                isISO8601: jest.fn()
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .post(baseURL + "/products")
                .send(bodyRequest);

            expect(response.status).toBe(401);
        })

        test("It should fail if the user is not Admir or Manager", async () => {
            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 2,
                details: "This is a smartphone",
                sellingPrice: 200,
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn().mockImplementation(() => ({
                                                isISO8601: jest.fn()
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 });
            });

            const response = await request(app)
                .post(baseURL + "/products")
                .send(bodyRequest);

            expect(response.status).toBe(401);
        })

        test("It should throw an error if the controller returns an error", async () => {
            const bodyRequest = {
                model: "testProduct",
                category: "Smartphone",
                quantity: 2,
                details: "This is a smartphone",
                sellingPrice: 200,
            }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isIn: jest.fn().mockImplementation(() => ({
                                isNumeric: jest.fn().mockImplementation(() => ({
                                    isInt: jest.fn().mockImplementation(() => ({
                                        isFloat: jest.fn().mockImplementation(() => ({
                                            optional: jest.fn().mockImplementation(() => ({
                                                isISO8601: jest.fn()
                                            }))
                                        }))
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });  

            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new Error("ProductController Error"));

            const response = await request(app).post(baseURL + "/products").send(bodyRequest);

            expect(response.status).toBe(503);
        }); 
    })

    describe("PATCH /products/:model", () => {
        test("It should return a 200 success code", async () => {
            const model = "testProduct";
            const initialQuantity = 2;
            const quantity = 4;
            const changeDate = "2024-06-09"
            const newQuantity = initialQuantity + quantity;
            

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue({quantity: newQuantity})

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity, changeDate });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model, quantity, changeDate)
            expect(response.body).toEqual({ quantity: { quantity: newQuantity } });
        })

        test("It should return a 200 success code without changeDate", async () => {
            const model = "testProduct";
            const initialQuantity = 2;
            const quantity = 4;
            const newQuantity = initialQuantity + quantity;
            const today = dayjs().format("YYYY-MM-DD")
            

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue({quantity: newQuantity})

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model, quantity, today)
            expect(response.body).toEqual({ quantity: { quantity: newQuantity } });
        })

        test("It should fail if the body of the request (quantity) is not valid", async () => {
            const model = "testProduct";
            const initialQuantity = 2;
            const quantity = -1;
            const newQuantity = initialQuantity + quantity;
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => {
                            throw new Error("Invalid quantity")
                        })
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            })

            const response = await request(app)
                .patch(baseURL + `/products/${model}`)
                .send({ quantity });

            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (changeDate) is not valid", async () => {
            const model = "testProduct";
            const quantity = 1;
            const changeDate = "2024/06/08"
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => {
                                        throw new Error("Invalid changeDate format")
                                    })
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            })

            const response = await request(app)
                .patch(baseURL + `/products/${model}`)
                .send({ quantity, changeDate });

            expect(response.status).toBe(422)
        })

        test("It should return a 400 error code is changeDate is after current date", async () => {
            const quantity = 4;
            const changeDate = dayjs().add(1, 'day').format("YYYY-MM-DD")
            

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity, changeDate });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('changeDate cannot be in the future')
        })

        test("It should fail if the user is not logged", async () => {
            const quantity = 4;
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity })
            expect(response.status).toBe(401);

        })

        test("It should fail if the user is not Admin or Manager", async () => {
            const quantity = 4;
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 });
            });

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity })
            expect(response.status).toBe(401);

        })

        test("It should throw an error if the controller returns an error", async () => {
            const quantity = 4;
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new Error("ProductController Error"));

            const response = await request(app)
                .patch(baseURL + "/products/testProduct")
                .send({ quantity })
            expect(response.status).toBe(503);

        })
    })

    describe("PATCH /products/:model/sell", () => {
        test("It should return a 200 success code", async() => {
            const model = "testProduct"
            const quantity = 2
            const sellingDate = "2024-06-08"

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(undefined)

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ sellingDate, quantity })
            
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
        })

        test("It should return a 200 success code without sellingDate", async() => {
            const model = "testProduct"
            const quantity = 2
            const today = dayjs().format("YYYY-MM-DD")

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(undefined)

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ quantity })
            
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, today)
        })

        test("It should fail if the body of the request (quantity) is not valid", async () => {
            const model = "testProduct";
            const quantity = -1;
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => {
                            throw new Error("Invalid quantity")
                        })
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            })

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ quantity });

            expect(response.status).toBe(422)
        })

        test("It should fail if the body of the request (sellingDate) is not valid", async () => {
            const model = "testProduct";
            const quantity = 3;
            const sellingDate = "2024/06/08"

            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => {
                                        throw new Error("Invalid sellingDate format")
                                    })
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            })

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ sellingDate, quantity });

            expect(response.status).toBe(422)
        })

        test("It should return a 400 error code is sellingDate is after current date", async () => {
            const quantity = 4;
            const model = "testProduct"
            const sellingDate = dayjs().add(1, 'day').format("YYYY-MM-DD")
            

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ sellingDate, quantity });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('sellingDate cannot be in the future')
        })

        test("It should fail if the user is not logged", async () => {
            const quantity = 4;
            const model = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ quantity })
            expect(response.status).toBe(401);
        })

        test("It should fail if the user is not Admin or Manager", async () => {
            const quantity = 4;
            const model = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 });
            });

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ quantity })
            expect(response.status).toBe(401);
        })

        test("It should throw an error if the controller returns an error", async () => {
            const quantity = 4;
            const model = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            isNumeric: jest.fn().mockImplementation(() => ({
                                isInt: jest.fn().mockImplementation(() => ({
                                    optional: jest.fn().mockImplementation(() => ({
                                        isISO8601: jest.fn()
                                    }))
                                }))
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new Error("ProductController Error"));

            const response = await request(app)
                .patch(baseURL + `/products/${model}/sell`)
                .send({ quantity })
            expect(response.status).toBe(503);
        })
    })

    describe("GET /products", () => {
        test("It should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            const mockProduct2: Product = new Product(200,"testProduct2", Category.LAPTOP, "2024-06-11", "", 2)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([mockProduct1, mockProduct2])

            const response = await request(app).get(baseURL + "/products")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined)
            expect(response.body).toEqual([mockProduct1, mockProduct2])
        })

        test("Test with grouping 'category', it should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            const mockProduct2: Product = new Product(200,"testProduct2", Category.SMARTPHONE, "2024-06-11", "", 2)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([mockProduct1,mockProduct2])

            const response = await request(app).get(baseURL + "/products").query({ grouping: "category", category: "Smartphone" })
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category", "Smartphone", undefined)
            expect(response.body).toEqual([mockProduct1, mockProduct2])
        })

        test("Test with grouping 'model', it should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([mockProduct1])

            const response = await request(app).get(baseURL + "/products").query({ grouping: "model", model: "testProduct1" })
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, "testProduct1")
            expect(response.body).toEqual([mockProduct1])
        })

        test("Test with grouping 'model' and both model and category present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next())
        
            const response = await request(app)
                .get(baseURL + "/products")
                .query({ grouping: "model", category: "Smartphone", model: "testProduct" })
            
            expect(response.status).toBe(422)
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 })
        })

        test("Test without grouping but with category and model, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
        
            const response = await request(app).get(baseURL + "/products").query({ category: "Smartphone", model: "testProduct1" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is not present, also category and model has to", status: 422 });
        });

        test("Test with grouping 'category' but without category, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
        
            const response = await request(app).get(baseURL + "/products").query({ grouping: "category" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is category, category has to be present and model has to be absent", status: 422 });
        });
        
        test("Test with grouping 'category' and model present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
        
            const response = await request(app).get(baseURL + "/products").query({ grouping: "category", model: "testProduct" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is category, category has to be present and model has to be absent", status: 422 });
        });

        test("Test with grouping 'model' but without model, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
        
            const response = await request(app).get(baseURL + "/products").query({ grouping: "model" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 });
        });
        
        test("Test with grouping 'model' and category present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
        
            const response = await request(app).get(baseURL + "/products").query({ grouping: "model", category: "Smartphone" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 });
        });

        test("It should fail if the user is not logged", async() => {
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            })
            

            const response = await request(app).get(baseURL + "/products").query({ model: "testProduct1" })
            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin or Manager", async() => {
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 });
            })
            

            const response = await request(app).get(baseURL + "/products").query({ model: "testProduct1" })
            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async() => {
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error("ProductController Error"))
            

            const response = await request(app).get(baseURL + "/products").query({ model: "testProduct1" })
            expect(response.status).toBe(503)
        })
    })


    describe("GET /products/available", () => {
        test("It should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            const mockProduct2: Product = new Product(200,"testProduct2", Category.LAPTOP, "2024-06-11", "", 2)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([mockProduct1, mockProduct2])

            const response = await request(app).get(baseURL + "/products/available")
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined)
            expect(response.body).toEqual([mockProduct1, mockProduct2])
        })

        test("Test with grouping 'category', it should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            const mockProduct2: Product = new Product(200,"testProduct2", Category.SMARTPHONE, "2024-06-11", "", 2)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([mockProduct1,mockProduct2])

            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "category", category: "Smartphone" })
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("category", "Smartphone", undefined)
            expect(response.body).toEqual([mockProduct1, mockProduct2])
        })

        test("Test with grouping 'model', it should return a 200 success code", async() => {

            const mockProduct1: Product = new Product(100,"testProduct1", Category.SMARTPHONE, "2024-06-10", "", 3)
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })
            

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue([mockProduct1])

            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "model", model: "testProduct1" })
            expect(response.status).toBe(200)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith("model", undefined, "testProduct1")
            expect(response.body).toEqual([mockProduct1])
        })

        test("Test with grouping 'model' and both model and category present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        
            const response = await request(app)
                .get(baseURL + "/products/available")
                .query({ grouping: "model", category: "Smartphone", model: "testProduct" });
            
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 });
        });

        

        test("Test without grouping but with category and model, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        
            const response = await request(app).get(baseURL + "/products/available").query({ category: "Smartphone", model: "testProduct1" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is not present, also category and model has to", status: 422 });
        });

        test("Test with grouping 'category' but without category, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        
            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "category" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is category, category has to be present and model has to be absent", status: 422 });
        });
        
        test("Test with grouping 'category' and model present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        
            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "category", model: "testProduct" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is category, category has to be present and model has to be absent", status: 422 });
        });

        test("Test with grouping 'model' but without model, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
        
            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "model" });
        
            expect(response.status).toBe(422);
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 });
        });
        
        test("Test with grouping 'model' and category present, it should return a 422 error", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next())
        
            const response = await request(app).get(baseURL + "/products/available").query({ grouping: "model", category: "Smartphone" })
        
            expect(response.status).toBe(422)
            expect(response.body).toEqual({ error: "If grouping is model, model has to be present and category has to be absent", status: 422 })
        });

        test("It should fail if the user is not logged", async() => {
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            })
            
            const response = await request(app).get(baseURL + "/products/available").query({ model: "testProduct1" })
            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async() => {
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                            optional: jest.fn().mockImplementation(() => ({
                                isIn: jest.fn()
                            }))
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new Error("ProductController Error"))
            

            const response = await request(app).get(baseURL + "/products/available").query({ model: "testProduct1" })
            expect(response.status).toBe(503)
        })
    })

    describe("DELETE /products/:model", () => {
        test("It should return a 200 success code", async() => {
            const modelToDelete = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true)
            const response = await request(app)
                .delete(baseURL + `/products/${modelToDelete}`)
            
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(modelToDelete);
        })

        test("It should fail if the user is not logged", async() => {
            const modelToDelete = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                        }))
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
                .delete(baseURL + `/products/${modelToDelete}`)
            
            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin or Manager", async() => {
            const modelToDelete = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 })
            })

            const response = await request(app)
                .delete(baseURL + `/products/${modelToDelete}`)
            
            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async() => {
            const modelToDelete = "testProduct"
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: jest.fn().mockImplementation(() => ({
                        isLength: jest.fn().mockImplementation(() => ({
                        }))
                    }))
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new Error("ProductController Error"))

            const response = await request(app)
                .delete(baseURL + `/products/${modelToDelete}`)
            
            expect(response.status).toBe(503)
        })
    })

    describe("DELETE /products", () => {
        test("It should return a 200 success code", async() => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValue(true)
            const response = await request(app)
                .delete(baseURL + `/products`)
            
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled()
        })

        test("It should fail if the user is not logged", async() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })

            const response = await request(app)
                .delete(baseURL + `/products`)
            
            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not Admin or Manager", async() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a Admin or Manager", status: 401 })
            })

            const response = await request(app)
                .delete(baseURL + `/products`)
            
            expect(response.status).toBe(401)
        })

        test("It should throw an error if the controller returns an error", async() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                req.user = testUser
                return next()
            })

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValue(new Error("ProductController Error"));


            const response = await request(app)
                .delete(baseURL + `/products`)
            
            expect(response.status).toBe(503);
        })
    })
})



