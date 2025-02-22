import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import * as productsErrors from "../src/errors/productError"
import { Category } from "../src/components/product"
import dayjs from "dayjs"

const routePath = "/ezelectronics";

const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer2", surname: "customer2", password: "customer2", role: "Customer" }
const customer3 = { username: "customer3", name: "customer3", surname: "customer3", password: "customer3", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }

const product1 = { model: "product1", category: "Smartphone", arrivalDate: "2024-06-12", sellingPrice: 200, quantity: 6, details: "product1Test" }
const product2 = { model: "product2", category: "Appliance", arrivalDate: "2024-06-11", sellingPrice: 400, quantity: 3, details: "product2Test" }
const product3 = { model: "product3", category: "Laptop", arrivalDate: "2024-06-11", sellingPrice: 600, quantity: 2, details: "product3Test" }
const product4 = { model: "product4", category: "Laptop", arrivalDate: "2024-06-11", sellingPrice: 600, quantity: 1, details: "product3Test" }

let customerCookie: string;
let customerCookie2: string;
let customerCookie3: string;
let adminCookie: string;

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

beforeAll(async () => {
    await cleanup()
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(customer2)
    customerCookie2 = await login(customer2)
    await postUser(customer3)
    customerCookie3 = await login(customer3)
    await postUser(admin)
    adminCookie = await login(admin)

})


afterAll(async () => {
    await cleanup();
});

describe("Cart Integration Tests", () => {
    describe("GET /carts", () => {
        describe("Correct test cases", () => {
            test("Should return the unpaid empty cart (cart not already present in the DB)", async () => {
                // GET /carts call
                const response = await request(app)
                    .get(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);

                expect(response.body).toEqual({ customer: "customer", paid: false, paymentDate: null, total: 0, products: [] });
            });

            test("Should return the unpaid empty cart (cart already present in the DB)", async () => {
                // Add the product to the DB
                await request(app)
                    .post(`${routePath}/products`)
                    .set("Cookie", adminCookie)
                    .send(product1)
                    .expect(200);

                // Add the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);

                // Remove the product from the cart
                await request(app)
                    .delete(`${routePath}/carts/products/` + product1.model)
                    .set("Cookie", customerCookie)
                    .expect(200);

                // GET /carts call
                const response = await request(app)
                    .get(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);

                expect(response.body).toEqual({ customer: "customer", paid: false, paymentDate: null, total: 0, products: [] });
            });

            test("Should return the unpaid cart (not empty)", async () => {
                // Add the product to the DB
                await request(app)
                    .post(`${routePath}/products`)
                    .set("Cookie", adminCookie)
                    .send(product2)
                    .expect(200);

                // Add the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);

                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product2.model })
                    .expect(200);

                // GET /carts call
                const response = await request(app)
                    .get(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);

                expect(response.body).toEqual({
                    customer: "customer", paid: false, paymentDate: null, total: 600, products: [
                        { model: "product1", quantity: 1, category: "Smartphone", price: 200 },
                        { model: "product2", quantity: 1, category: "Appliance", price: 400 }
                    ]
                });
            });
        });
    });
    describe("POST /carts", () => {
        describe("Correct test cases", () => {

            test("Should add a product to the cart(product already in the cart)", async () => {
                //Add an other product to the cart
                const response = await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);

                expect(response.body).toEqual({});
            });
            test("Should add a product to the cart(product not in the cart)", async () => {
                //Add a new product to the cart
                await request(app)
                    .post(`${routePath}/products`)
                    .set("Cookie", adminCookie)
                    .send(product3)
                    .expect(200);
                
                const response = await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product3.model })
                    .expect(200);

                expect(response.body).toEqual({});
            });
            test("Should add a product to the cart(cart not already present in the DB)", async () => {
                //pago carrello esistenente cosi non ci sono piu carrelli non pagati
                await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);

                //Add a new product to the cart
                const response = await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);

                expect(response.body).toEqual({});
            });
        });
        describe("Incorrect test cases", () => {
            test("Should return an error because the product does not exist", async () => {
                const response = await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: "nonExistingProduct" })
                    .expect(404);
                expect(response.body).toEqual({"error": "Product not found", "status": 404});
            });
            test("Should return an error because the product quantity is 0", async () => {
                //Add new product with quantity = 1
                await request(app)
                    .post(`${routePath}/products`)
                    .set("Cookie", adminCookie)
                    .send(product4)
                    .expect(200);
                //Add new product in the cart with quantity = 1
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product4.model })
                    .expect(200);
                //checkout the cart to set the quantity to 0
                await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);    
                

                const response = await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product4.model })
                    .expect(409);
                expect(response.body).toEqual({"error": "Product stock is empty", "status": 409});
            });
        });
    });
    describe("PATCH /carts", () => {
        describe("Correct test cases", () => {
            test("Should checkout the cart and return an empty object", async () => {
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);
                const response = await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(200);

                expect(response.body).toEqual({});    
            });
        });
        describe("Incorrect test cases", () => {
            test("Should return an error because the cart unpaid does not exist", async () => {
                const response = await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(404);
                expect(response.body).toEqual({"error": "Cart not found", "status": 404});
            });
            test("Should return an error because the cart is empty", async () => {
                // Add the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product1.model })
                    .expect(200);

                // Remove the product from the cart
                await request(app)
                    .delete(`${routePath}/carts/products/` + product1.model)
                    .set("Cookie", customerCookie)
                    .expect(200);

                const response = await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(400);
                expect(response.body).toEqual({"error": "Cart is empty", "status": 400});
            });
            test("Should return an error because the product quantity in stock is 0", async () => {
                // Add the product to the cart with quantity = 1(because one was already sold)
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product3.model })
                    .expect(200);
                //add an other(it will drop an error because the quantity in stock is 1)
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product3.model })
                    .expect(200);

                const response = await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .expect(409);
                expect(response.body).toEqual({"error": "Product stock cannot satisfy the requested quantity", "status": 409});
                
            });
        });
    });
    describe("GET /carts/history", () => { 
        describe("Correct test cases", () => {
            test("Should return an array with all the paid carts", async () => {
                
                //Add a product for the customer2
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);
                //Pay the cart
                await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .expect(200);

                const response = await request(app)
                    .get(`${routePath}/carts/history`)
                    .set("Cookie", customerCookie2)
                    .expect(200);

                expect(response.body).toEqual([{
                    customer: customer2.name,
                    paid: true,
                    paymentDate: dayjs().format("YYYY-MM-DD"),
                    total: 200,
                    products: [
                        {
                            model: "product1",
                            category: "Smartphone",
                            quantity: 1,
                            price: 200
                        }
                    ]
                }]);
            });
            test("Should return an empty array of cart(no paid carts)", async () => {
                const response = await request(app)
                    .get(`${routePath}/carts/history`)
                    .set("Cookie", customerCookie3)
                    .expect(200);

                expect(response.body).toEqual([]);
            });
        });
    });
    describe("DELETE /carts/products", () => {
        describe("Correct test cases", () => {
            test("Should remove the product from the cart(only one unit)", async () => {
                // Add the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);
                
                const response = await request(app)
                .delete(`${routePath}/carts/products/` + product1.model)
                .set("Cookie", customerCookie2)
                .expect(200);

                expect(response.body).toEqual({});
            });
            test("Should remove the product from the cart(more than one unit)", async () => {
                // Add 2 units of the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);

                const response = await request(app)
                .delete(`${routePath}/carts/products/` + product1.model)
                .set("Cookie", customerCookie2)
                .expect(200);

                expect(response.body).toEqual({});
            });
        });
        describe("Incorrect test cases", () => {
            test("Should return an error because the product is not in stock", async () => {
                const response = await request(app)
                .delete(`${routePath}/carts/products/` + "notInStock")
                .set("Cookie", customerCookie2)
                .expect(404);

                expect(response.body).toEqual({"error": "Product not found", "status": 404});
            });
            test("Should return an error because does not exist an unpaid cart", async () => {
                const response = await request(app)
                .delete(`${routePath}/carts/products/` + product1.model)
                .set("Cookie", customerCookie3)
                .expect(404);

                expect(response.body).toEqual({"error": "Cart not found", "status": 404});

            });
            test("Should return an error because the unpaid cart is empty", async () => {
                //remove the only remani product from the cart(Customer 2)
                await request(app)
                    .delete(`${routePath}/carts/products/` + product1.model)
                    .set("Cookie", customerCookie2)
                    .expect(200);
                const response = await request(app)
                .delete(`${routePath}/carts/products/` + product1.model)
                .set("Cookie", customerCookie2)
                .expect(404);

                expect(response.body).toEqual({"error": "Cart not found", "status": 404});    
            });
            test("Should return an error because the product is not in the cart", async () => {
                //Add the product to the cart
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);
                    
                const response = await request(app)
                .delete(`${routePath}/carts/products/` + product2.model)
                .set("Cookie", customerCookie2)
                .expect(404);

                expect(response.body).toEqual({"error": "Product not in cart", "status": 404});
            });
        });
    });
    describe("DELETE /carts/current", () => {
        describe("Correct test cases", () => {
            test("Should delete the product from the cart", async () => {
                const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie2)
                .expect(200);

                expect(response.body).toEqual({});

            });

        });
        describe("Incorrect test cases", () => {
            test("Should return an error because does not exist an unpaid cart", async () => {
                const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie3)
                .expect(404);

                expect(response.body).toEqual({"error": "Cart not found", "status": 404});
            });
        });
    });
    describe("DELETE /carts", () => {
        describe("Correct test cases", () => {
            test("Should delete all the carts", async () => {
                const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(200);

                expect(response.body).toEqual({});
            })
        });
    });
    describe("GET /carts/all", () => {
        describe("Correct test cases", () => {
            test("Should return an array empty because there are no carts", async () => {
                const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200);

                expect(response.body).toEqual([]);
            });

            test("Should return an array with all the carts", async () => {
                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie2)
                    .send({ model: product1.model })
                    .expect(200);

                await request(app)
                    .post(`${routePath}/carts`)
                    .set("Cookie", customerCookie)
                    .send({ model: product2.model })
                    .expect(200);

                const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200);

                expect(response.body).toHaveLength(2);
                expect(response.body).toEqual([
                    {
                        customer: customer2.name,
                        paid: false,
                        paymentDate: null,
                        total: 200,
                        products: [
                            {
                                model: product1.model,
                                quantity: 1,
                                category: product1.category,
                                price: product1.sellingPrice

                            }
                        ]
                    },
                    {
                        customer: customer.name,
                        paid: false,
                        paymentDate: null,
                        total: 400,
                        products: [
                            {
                                model: product2.model,
                                quantity: 1,
                                category: product2.category,
                                price: product2.sellingPrice
                            }
                        ]
                    }
                ])
            });
        });
    });
});