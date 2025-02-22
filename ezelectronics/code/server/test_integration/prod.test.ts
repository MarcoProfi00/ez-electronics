import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import dayjs from "dayjs"
import { Category } from "../src/components/product"

const routePath = "/ezelectronics"

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//creo un prodotto nel db 
const productTest = {
    model: "test",
    category: "Smartphone",
    arrivalDate: "2024-04-01",
    sellingPrice: 200,
    quantity: 6,
    details: "test"
}
let adminCookie: string

//Funzione che crea un nuovo utente
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
};

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

const postProduct = async (productInfo: any, cookie: string) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", cookie)
        .send(productInfo)
        .expect(200);

    // Optionally, you can add checks here to verify the product registration
    const productsResponse = await request(app)
        .get(`${routePath}/products`)
        .set("Cookie", cookie)
        .expect(200);
    const products = productsResponse.body;
    const product = products.find((p: any) => p.model === productInfo.model);
    expect(product).toBeDefined(); // Check if the product we just created exists
    expect(product.category).toBe(productInfo.category);
    // Add more assertions as needed
}


/**
 * Prima di fare i test nel db c'è un admin e un prodotto
 */
beforeAll(async () => {
    await cleanup()
    await postUser(admin)
    adminCookie = await login(admin)

    await postProduct(productTest, adminCookie);
})

afterAll(async () => {
    await cleanup()
})

describe("Integration Test Product", () => {
    describe("Product routes integration test POST /products", () => {
        test("It should return a 200 success code and register a new product", async() => {
            const testProduct = {
                model: "testProduct",
                category: "Smartphone",
                arrivalDate: "2024-06-12",
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct)
                .expect(200)
            
            //After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the product is present in the database
            //A possible way is retrieving all products and looking for the product we just created
            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(products.body).toHaveLength(2) //due prodotti: il prodotto istanziato e quello appena creato
            let product = products.body.find((prod: any) => prod.model === testProduct.model)
            expect(product).toBeDefined() //We expect the product we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(product.category).toBe(testProduct.category)
            expect(product.arrivalDate).toBe(testProduct.arrivalDate)
            expect(product.sellingPrice).toBe(testProduct.sellingPrice)
            expect(product.quantity).toBe(testProduct.quantity)
            expect(product.details).toBe(testProduct.details)
        })

        test("It should return a 200 success code and register a new product without arrivalDate", async() => {
            const testProduct = {
                model: "testProduct1",
                category: "Smartphone",
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct)
                .expect(200)
            
            await request(app)
                .delete(`${routePath}/products/testProduct1`) 
                .set("Cookie", adminCookie)
                .expect(200)
        })

        test("It should return a 400 error if arrivalDate is after the current date", async() => {
            const testProduct = {
                model: "testProduct",
                category: "Smartphone",
                arrivalDate: dayjs().add(1, 'day').format("YYYY-MM-DD"), // Data futura
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }
            const testProduct1 = {
                model: "testProduct",
                category: "Smartphone",
                arrivalDate: dayjs().add(2, 'day').format("YYYY-MM-DD"), // Data futura
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            //aggiungo il prodotto con la data di domani
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct)
                .expect(400)
            //aggiungo il prodotto con la data tra due giorni
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct1)
                .expect(400)
        })

        test("It should return a 409 if model represents an already existing set of products in the database", async() => {
            const testProduct = {
                model: "testProductEqual",
                category: "Smartphone",
                arrivalDate: dayjs().format("YYYY-MM-DD"),
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }
            const testProduct1 = {
                model: "testProductEqual",
                category: "Smartphone",
                arrivalDate: dayjs().format("YYYY-MM-DD"),
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            //aggiungo il prodotto testProduct 
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct)
                .expect(200)
            //aggiungo il prodotto testProduct1 che ha lo stesso model di testProduct
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct1)
                .expect(409)
        })
    })


    describe("Product routes integration test PATCH /products/:model", () => {
        test("It should return a 200 success code if increases the available quantity of a set of products", async() => {
            const bodyRequest = {
                quantity: 1,
                changeDate: dayjs().format("YYYY-MM-DD")
            }
            await request(app)
                .patch(`${routePath}/products/${productTest.model}`)
                .set("Cookie", adminCookie)
                .send(bodyRequest)
                .expect(200)

            let products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: productTest.model})
                .expect(200)
            let product = products.body.find((prod: any) => prod.model === productTest.model)
            expect(product).toBeDefined() //Mi aspetto che il prodotto trovato esiste nell'array
            expect(product.quantity).toBe(productTest.quantity + 1) //mi aspetto che la quantità del prodotto è incrementata di 1
        })

        test("It should return a 200 success code if increases the available quantity of a set of products without changeDate", async() => {
            
            const testProductNew = {
                model: "testProductNew",
                category: "Smartphone",
                arrivalDate: "2024-06-12",
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }
            const bodyRequest = {
                quantity: 1
            }
            
            //creo il prodotto
            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProductNew)
                .expect(200)
            
            //modifico la quantità
            await request(app)
                .patch(`${routePath}/products/${testProductNew.model}`)
                .set("Cookie", adminCookie)
                .send(bodyRequest)
                .expect(200)

            //controllo la quantità giusta con una get
            let products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: testProductNew.model})
                .expect(200)
            let product = products.body.find((prod: any) => prod.model === testProductNew.model)
            expect(product).toBeDefined() //Mi aspetto che il prodotto trovato esiste nell'array
            expect(product.quantity).toBe(testProductNew.quantity + 1) //mi aspetto che la quantità del prodotto è incrementata di 1
        
            //elimino il prodotto appena creato
            await request(app)
                .delete(`${routePath}/products/${testProductNew.model}`) 
                .set("Cookie", adminCookie)
                .expect(200)
        })

        test(`It should return a 404 error if model does not represent a product in the database, 
            a 400 error if changeDate is after the current date, 
            a 400 error if changeDate is before the product's arrivalDate`, async() => {
            const firstBodyRequest = {
                quantity: 1,
                changeDate: dayjs().format("YYYY-MM-DD")
            }

            const secondBodyRequest = {
                quantity: 1,
                changeDate: dayjs().add(2, 'day').format("YYYY-MM-DD"), // Data futura
            }

            const thirdBodyRequest = {
                quantity: 1,
                changeDate: "2024-03-01" //arrivalDate productTest = 2024-04-01
            }
            //model inesistente
            await request(app)
                .patch(`${routePath}/products/notExsistModel`)
                .set("Cookie", adminCookie)
                .send(firstBodyRequest)
                .expect(404)

            //data futura
            await request(app)
                .patch(`${routePath}/products/${productTest.model}`)
                .set("Cookie", adminCookie)
                .send(secondBodyRequest)
                .expect(400)

            //data precedente ad arrivalDate
            await request(app)
                .patch(`${routePath}/products/${productTest.model}`)
                .set("Cookie", adminCookie)
                .send(thirdBodyRequest)
                .expect(400)
        })
    })

    describe("Product routes integration test PATCH /products/:model/sell", () => {
        test("It should return a 200 success code if sell the product", async() => {
            const bodyRequest = {
                sellingDate: dayjs().format("YYYY-MM-DD"),
                quantity: 1,
            }
            await request(app)
                .patch(`${routePath}/products/testProduct/sell`) //vendo un'istanza del prodotto aggiunto nel primo test
                .set("Cookie", adminCookie)
                .send(bodyRequest)
                .expect(200)

            let products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send({model: productTest.model}) //get/products con bodyRequest {model: model}
                .expect(200)
            let product = products.body.find((prod: any) => prod.model === "testProduct")
            expect(product).toBeDefined() //Mi aspetto che il prodotto trovato esiste nell'array
            expect(product.quantity).toBe(1) //mi aspetto che la quantità del prodotto da 2 passi a 1
        })

        test("It should return a 200 success code if sell the product and sellingDate is null or undefined", async() => {
            const bodyRequest = {
                quantity: 1
            }
            await request(app)
                .patch(`${routePath}/products/testProduct/sell`) //vendo un'istanza del prodotto aggiunto nel primo test
                .set("Cookie", adminCookie)
                .send(bodyRequest)
                .expect(200)

            let products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send({model: productTest.model}) //get/products con bodyRequest {model: model}
                .expect(200)
            let product = products.body.find((prod: any) => prod.model === "testProduct")
            expect(product).toBeDefined() //Mi aspetto che il prodotto trovato esiste nell'array
            expect(product.quantity).toBe(0) //mi aspetto che la quantità del prodotto da 1 passi a 0
        })

        

        test(`It should return a 404 error if model does not represent a product in the database, 
            a 400 error if sellingDate is after the current date, 
            a 400 error if selling is before the product's arrivalDate`, async() => {
        const firstBodyRequest = {
            sellingDate: dayjs().format("YYYY-MM-DD"),
            quantity: 1
        }

        const secondBodyRequest = {
            sellingDate: dayjs().add(2, 'day').format("YYYY-MM-DD"), // Data futura,
            quantity: 1 
        }

        const thirdBodyRequest = {
            sellingDate: "2024-03-01", //sellingDate before arrivalDate
            quantity: 1,
        }
        //model inesistente
        await request(app)
            .patch(`${routePath}/products/notExsistModel/sell`)
            .set("Cookie", adminCookie)
            .send(firstBodyRequest)
            .expect(404)

        //data futura
        await request(app)
            .patch(`${routePath}/products/testProduct/sell`)
            .set("Cookie", adminCookie)
            .send(secondBodyRequest)
            .expect(400)

        //data precedente ad arrivalDate
        await request(app)
            .patch(`${routePath}/products/testProduct/sell`)
            .set("Cookie", adminCookie)
            .send(thirdBodyRequest)
            .expect(400)
    })

    test(`It should return a 409 error if model represents a product whose available quantity is 0 and
        if the available quantity of model is lower than the requested quantity`, async() => {
            const testProduct2 = {
                model: "testProduct2",
                category: "Laptop",
                arrivalDate: "2024-06-13",
                sellingPrice: 1000,
                quantity: 1, //prodotto non disponibile
                details: "Not Available Product"
            }

            const firstBodyRequest = {
                sellingDate: dayjs().format("YYYY-MM-DD"),
                quantity: 1
            }

            const secondBodyRequest = {
                sellingDate: dayjs().format("YYYY-MM-DD"),
                quantity: 9
            }

            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct2)
                .expect(200)
            
            //provo a vendere il prodotto appena creato
            await request(app)
                .patch(`${routePath}/products/${testProduct2.model}/sell`)
                .set("Cookie", adminCookie)
                .send(firstBodyRequest)
                .expect(200)
            
            //provo a rivendere il prodotto
            await request(app)
                .patch(`${routePath}/products/${testProduct2.model}/sell`)
                .set("Cookie", adminCookie)
                .send(firstBodyRequest)
                .expect(409)

            //provo a vendere il prodotto creato nella beforeAll ma con una quantità maggiore di quella disponibile
            await request(app)
                .patch(`${routePath}/products/${productTest.model}/sell`)
                .set("Cookie", adminCookie)
                .send(secondBodyRequest)
                .expect(409)
        })
    })

    describe("Product routes integration test GET /products", () => {
        test("It should return a 200 success code if return all products", async() => {
            //get senza parametri
            const products = await request(app)
                .get(`${routePath}/products`) 
                .set("Cookie", adminCookie)
                .expect(200)
            expect(products.body).toHaveLength(4)
            let product = products.body.find((prod: any) => prod.model === productTest.model)
            expect(product).toBeDefined()
            expect(product.category).toBe(productTest.category)
            expect(product.arrivalDate).toBe(productTest.arrivalDate)
            expect(product.sellingPrice).toBe(productTest.sellingPrice)
            expect(product.details).toBe(productTest.details)

            //get con gruping model
            let products1 = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: "test"}) 
                .expect(200)
            expect(products1.body).toHaveLength(1)
            let product1 = products1.body.find((prod: any) => prod.model === productTest.model)
            expect(product1).toBeDefined()

            //get con gruping category
            let productsCategory = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "category", category: "Smartphone"})
                .expect(200)
            expect(productsCategory.body).toHaveLength(3)
        })

        test(`It should return a 422 error if grouping is null and any of category or model is not null
    It should return a 422 error if grouping is category and category is null OR model is not null
    It should return a 422 error if grouping is model and model is null OR category is not null
    It should return a 404 error if model does not represent a product in the database (only when grouping is model)`, async() => {

            await request(app)
                .get(`${routePath}/products`) 
                .set("Cookie", adminCookie)
                .query({category: "Smartphone", model: "test"})
                .expect(422)

            await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "category"}) 
                .expect(422)

            await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model"})
                .expect(422)
            
            await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: "NotExistModel"})
                .expect(404)
        })
    })

    describe("Product routes integration test GET /products/available", () => {
        test("It should return a 200 success code if return all products available", async() => {

            const products = await request(app)
                .get(`${routePath}/products/available`) 
                .set("Cookie", adminCookie)
                .expect(200)
            expect(products.body).toHaveLength(2) //due prodotti con quantità > 0 (due sono stati venduti precedentemente)
            let product = products.body.find((prod: any) => prod.model === productTest.model)
            expect(product).toBeDefined()
            expect(product.category).toBe(productTest.category)
            expect(product.arrivalDate).toBe(productTest.arrivalDate)
            expect(product.sellingPrice).toBe(productTest.sellingPrice)
            expect(product.details).toBe(productTest.details)

            //get con gruping model
            let products1 = await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: "test"}) 
                .expect(200)
            expect(products1.body).toHaveLength(1)
            let product1 = products1.body.find((prod: any) => prod.model === productTest.model)
            expect(product1).toBeDefined()

            //get con gruping category
            let productsCategory = await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .query({grouping: "category", category: "Smartphone"})
                .expect(200)
            expect(productsCategory.body).toHaveLength(2) //2 smartphone disponibili
            
        })

        test(`It should return a 422 error if grouping is null and any of category or model is not null
    It should return a 422 error if grouping is category and category is null OR model is not null
    It should return a 422 error if grouping is model and model is null OR category is not null
    It should return a 404 error if model does not represent a product in the database (only when grouping is model)`, async() => {

            await request(app)
                .get(`${routePath}/products/available`) 
                .set("Cookie", adminCookie)
                .query({category: "Smartphone", model: "test"})
                .expect(422)

            await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .query({grouping: "category"}) 
                .expect(422)

            await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .query({grouping: "model"})
                .expect(422)
            
            await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: "NotExistModel"})
                .expect(404)
        })  
    })

    describe("Product routes integration test DELETE /products/:model", () => {
        test("It should return a 200 success code if delete a product for database", async() => {
            const testProduct4 = {
                model: "testProduct4",
                category: "Smartphone",
                arrivalDate: "2024-06-12",
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct4)
                .expect(200)

            await request(app)
                .delete(`${routePath}/products/${testProduct4.model}`) 
                .set("Cookie", adminCookie)
                .expect(200)

            //faccio una get by model e cerco il modello appena eliminato dovrebbe tornarmi errore
            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .query({grouping: "model", model: "testProduct4"})
                .expect(404)
        })
        test("It should return a 404 error code model does not represent a product in the database", async() => {
            const testProduct4 = {
                model: "testProduct4",
                category: "Smartphone",
                arrivalDate: "2024-06-12",
                sellingPrice: 200,
                quantity: 2,
                details: "test"
            }

            await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(testProduct4)
                .expect(200)

            await request(app)
                .delete(`${routePath}/products/NotExistModel`) //modell non esistente
                .set("Cookie", adminCookie)
                .expect(404)
        })
    })

    describe("Product routes integration test DELETE /products", () => {
        test("It should return a 200 success code if delete a product for database", async() => {

            await request(app)
                .delete(`${routePath}/products`) 
                .set("Cookie", adminCookie)
                .expect(200)

            //faccio una get by model e cerco il modello appena eliminato dovrebbe tornarmi errore
            const products = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(products.body).toHaveLength(0)
        })
    })
})