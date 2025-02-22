import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import crypto from "crypto"
import { Database } from "sqlite3"
import { ChangeDateBeforeArrivalDate, EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError, ProductSoldError, SellingDateBeforeArrivalDate } from "../../src/errors/productError"
import { Category, Product } from "../../src/components/product"
import dayjs from "dayjs"

let mockProduct = new Product(100,"testProduct",Category.SMARTPHONE,"2024-06-06","This is a smartphone", 2)
let mockProduct2 = new Product(200,"testProduct2",Category.APPLIANCE, "2024-06-06","",4)
let mockProduct3 = new Product(300,"testProduct3",Category.SMARTPHONE,"2024-06-06","",4)
let mockProductWithQuantity0 = new Product(100, "testProduct",Category.SMARTPHONE, "2024-06-06","This is a smartphone", 0)


jest.mock("crypto")
jest.mock("../../src/db/db.ts")

describe("ProductDAO Unit Test", () => {
    describe("TEST for addNewProduct", () => {
        test("It should return undefined for register new product", async() => {
            const productDAO = new ProductDAO()
        
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            })   
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })
            
            const result = await productDAO.addNewProduct(mockProduct.model, mockProduct.category, mockProduct.quantity, mockProduct.details, mockProduct.sellingPrice, mockProduct.arrivalDate)
            expect(result).toBeUndefined()
            
            mockDBRun.mockRestore()
            mockDBGet.mockRestore()
        })

        test("It should reject with ProductAlreadyExistsError if the product already exists", async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, mockProduct) // Prodotto esistente trovato
                return {} as Database
            });

            await expect(productDAO.addNewProduct(mockProduct.model, mockProduct.category, mockProduct.quantity, mockProduct.details, mockProduct.sellingPrice, mockProduct.arrivalDate))
                .rejects
                .toThrow(ProductAlreadyExistsError);

            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail to get the product", async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error get product"),null) //Errore nella get del prodotto
                return {} as Database
            })

            await expect(productDAO.addNewProduct(mockProduct.model, mockProduct.category, mockProduct.quantity, mockProduct.details, mockProduct.sellingPrice, mockProduct.arrivalDate))
                .rejects
                .toThrowError("Database error: Error get product")
            
            mockDBGet.mockRestore()
        })

        test('It should throw an error if database fail to insert the product', async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            })
        
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error("Database Error: Error inserting product")); 
                return {} as Database
            })
        
            const addNewProductPromise = productDAO.addNewProduct(mockProduct.model, mockProduct.category, mockProduct.quantity, mockProduct.details, mockProduct.sellingPrice, mockProduct.arrivalDate);  
            await expect(addNewProductPromise).rejects.toThrowError("Database Error: Error inserting product")
        
            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        })

        test("It should throw an error if throw in the try block", async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("Unexpected Error");
            })

            await expect(productDAO.addNewProduct(mockProduct.model, mockProduct.category, mockProduct.quantity, mockProduct.details, mockProduct.sellingPrice, mockProduct.arrivalDate))
                .rejects
                .toThrowError("Unexpected Error")

            mockDBGet.mockRestore()
        }) 
    })

    describe("TEST for changeProductQuantity", () => {
        test("It should return a new quantity of product", async () => {
            const productDAO = new ProductDAO();

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct)
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })

            const newQuantity = await productDAO.changeProductQuantity(mockProduct.model, 4, mockProduct.arrivalDate)
            expect(newQuantity).toBe(6)

            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        })

        test("It should return a 404 if model does not represent a product in the database", async () => {
            const productDAO = new ProductDAO();

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null) 
                return {} as Database
            })

            await expect(productDAO.changeProductQuantity(mockProduct.model, 4, mockProduct.arrivalDate))
                .rejects
                .toThrowError(ProductNotFoundError)

            mockDBGet.mockRestore();
        })


        test("It should return a 400 error if changeDate is before arrivalDate", async () => {
            const productDAO = new ProductDAO();
            const mockChangeDate = "2024-06-03" //data precedente ad arrivalDate

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct)
                return {} as Database
            })

            await expect(productDAO.changeProductQuantity(mockProduct.model, 4, mockChangeDate))
                .rejects
                .toThrowError(ChangeDateBeforeArrivalDate)
            
            mockDBGet.mockRestore();
        })

        test("It should throw an error if database fail to return the product", async () => {
            const productDAO = new ProductDAO();

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error get product"),null) //Errore nella get del prodotto
                return {} as Database
            })

            await expect(productDAO.changeProductQuantity(mockProduct.model, 4, mockProduct.arrivalDate))
                .rejects
                .toThrowError("Database error: Error get product")
            
            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail to update the product", async () => {
            const productDAO = new ProductDAO();
            const mockChangeDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, mockProduct)
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to update the quantity"))
                return {} as Database
            })

            const newQuantity = await expect(productDAO.changeProductQuantity(mockProduct.model, 4, mockChangeDate))
                .rejects
                .toThrowError("Database error: Error to update the quantity")
            
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        })

        test("It should throw an error if throw in the try block", async () => {
            const productDAO = new ProductDAO()
            const mockChangeDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("Unexpected Error");
            })

            await expect(productDAO.changeProductQuantity(mockProduct.model, 4, mockChangeDate))
                .rejects
                .toThrowError("Unexpected Error")

            mockDBGet.mockRestore()
        }) 
    })

    describe("TEST for sellProduct", () => {
        test("It should return undefined to sell the product", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct) //Prodotto trovato
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })

            const result = await productDAO.sellProduct(mockProduct.model, 2, mockSellingDate)
            expect(result).toBeUndefined()
            mockDBRun.mockRestore()
            mockDBGet.mockRestore()
        } )


        test("It should return 404 error if model does not represent a product in the database", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            })


            await expect(productDAO.sellProduct(mockProduct.model, 4, mockSellingDate))
                .rejects
                .toThrowError(ProductNotFoundError)
            
            mockDBGet.mockRestore()
        })

        test("It should return 400 error if sellingDate is before the arrivalDate of the product", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = "2024-06-02"

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct) 
                return {} as Database
            })


            await expect(productDAO.sellProduct(mockProduct.model, 4, mockSellingDate))
                .rejects
                .toThrowError(SellingDateBeforeArrivalDate)
            
            mockDBGet.mockRestore()
        })

        test("It should return 409 error if available quantity of product is 0", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")
            

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProductWithQuantity0) 
                return {} as Database
            })

            await expect(productDAO.sellProduct(mockProductWithQuantity0.model, 1, mockSellingDate))
                .rejects
                .toThrowError(EmptyProductStockError)
            
            mockDBGet.mockRestore()
        })

        test("It should return 409 error if the product's quantity is lower than the requested quantity", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")     

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct) 
                return {} as Database
            })

            await expect(productDAO.sellProduct(mockProduct.model, 4, mockSellingDate))
                .rejects
                .toThrowError(LowProductStockError)
            
            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail to return the product", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error get product"),null)
                return {} as Database
            })

            await expect(productDAO.sellProduct(mockProduct.model, 1, mockSellingDate))
                .rejects
                .toThrowError("Database error: Error get product")
            
            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail to update quantity the product", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct) 
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to update the quantity of the product"));
                return {} as Database
            })

            await expect(productDAO.sellProduct(mockProduct.model, 1, mockSellingDate))
                .rejects
                .toThrowError("Database error: Error to update the quantity of the product")
            
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        })

        test("It should throw an error if throw in the try block", async() => {
            const productDAO = new ProductDAO()
            const mockSellingDate = dayjs().format("YYYY-MM-DD")

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("Error for try block")
            })

            await expect(productDAO.sellProduct(mockProduct.model, 1, mockSellingDate))
                .rejects
                .toThrowError("Error for try block")
            
            mockDBGet.mockRestore()
        })
    })


    describe("TEST getAllProducts", () => { /* */
        test("It should return a array of products", async() => {
            const productDao = new ProductDAO()
            
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct, mockProduct2])
                return {} as Database
            })

            const products = await productDao.getAllProducts(false) //se false non tiene conto della quantity
            expect(products).toEqual([mockProduct,mockProduct2])

            mockDBAll.mockRestore()
        })

        test("It should return a array of products with quantity > 0", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct2])
                return {} as Database
            })

            const products = await productDao.getAllProducts(true) //se true tiene conto della quantity 
            expect(products).toEqual([mockProduct2])

            mockDBAll.mockRestore()
        })

        test("It should throw an error if database fail to get the products", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to get a products"), null)
                return {} as Database
            })

            await expect(productDao.getAllProducts(true))
                .rejects
                .toThrowError("Database error: Error to get a product")

            mockDBAll.mockRestore()
        })

        test("It should throw an error if throw in the try block", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw new Error("Error for try block")
            })

            await expect(productDao.getAllProducts(true))
                .rejects
                .toThrowError("Error for try block")

            mockDBAll.mockRestore()
        })
    })

    describe("TEST getProductsByCategory", () => {
        test("It should return an array of products of a category specified", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct, mockProduct3])
                return {} as Database
            })

            const products = await productDao.getProductsByCategory("Smartphone", false)
            expect(products).toEqual([mockProduct, mockProduct3])

            mockDBAll.mockRestore()
        })

        test("It should return an array of products of a category specified with quantity > 0", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct, mockProduct3])
                return {} as Database
            })

            const products = await productDao.getProductsByCategory("Smartphone", true)
            expect(products).toEqual([mockProduct, mockProduct3])

            mockDBAll.mockRestore()
        })

        test("It should throw an error if database fail to get the products", async() => {
            const productDao = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to get a products"), null)
                return {} as Database
            })

            await expect(productDao.getProductsByCategory("Smartphone",true))
                .rejects
                .toThrowError("Database error: Error to get a product")

            mockDBAll.mockRestore()
        })

        test("It should throw an error if throw in the try block", async() => {
            const productDao = new ProductDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw new Error("Error for try block")
            })

            await expect(productDao.getProductsByCategory("Smartphone",false))
                .rejects
                .toThrowError("Error for try block")

            mockDBAll.mockRestore()
        })
    })

    describe("TEST getProductByModel", () => {
        test("It should return an array of products of a model specified", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct])
                return {} as Database
            })

            const products = await productDao.getProductByModel("testProduct1", false)
            expect(products).toEqual([mockProduct])

            mockDBAll.mockRestore()
        })

        test("It should return an array of products of a model specified with quantity > 0", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [mockProduct])
                return {} as Database
            })

            const products = await productDao.getProductByModel("testProduct1", true)
            expect(products).toEqual([mockProduct])

            mockDBAll.mockRestore()
        })

        test("It should return 404 error if model does not represent a product in the database", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [])
                return {} as Database
            })

            await expect(productDao.getProductByModel("testProduct",false))
                .rejects
                .toThrowError(ProductNotFoundError)

            mockDBAll.mockRestore()
        })

        test("It should throw an error if database fail to get the product", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to get product"), null)
                return {} as Database
            })

            await expect(productDao.getProductByModel("testProduct", false))
                .rejects
                .toThrowError("Database error: Error to get product")

            mockDBAll.mockRestore()
        })

        test("It should throw an error if throw in the try block", async() => {
            const productDao = new ProductDAO()

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw new Error("Error for try block")
            })

            await expect(productDao.getProductByModel("testProduct",false))
                .rejects
                .toThrowError("Error for try block")

            mockDBAll.mockRestore()
        })
    })

    describe("TEST deleteProduct", () => {
        test("It should return true for delete product", async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct)
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })

            const result = await productDAO.deleteProduct("testProduct")
            expect(result).toBe(true)
            mockDBRun.mockRestore()
            mockDBGet.mockRestore()
        })

        test("It should return 404 error if model does not represent a product in the database", async () => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            })

            await expect(productDAO.deleteProduct(mockProduct.model))
                .rejects.toThrowError(ProductNotFoundError)
            
            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail to get the product", async() => {
            const productDAO = new ProductDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error ("Database error: Error to get product"), null)
                return {} as Database
            })

            await expect(productDAO.deleteProduct("testProduct"))
                .rejects
                .toThrowError("Database error: Error to get product")

            mockDBGet.mockRestore()
        })

        test("It should throw an error if database fail delete the product", async() => {
            const productDAO = new ProductDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProduct)
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error ("Database Error: Error to delete a product"))
                return {} as Database
            })

            await expect(productDAO.deleteProduct(mockProduct.model))
                .rejects
                .toThrowError("Database Error: Error to delete a product")
            mockDBGet.mockRestore()
            mockDBRun.mockRestore()
        })

        test("It should throw an error if throw in the try block", async () => {
            const productDAO = new ProductDAO()
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw new Error("Error fo try block")
            })

            await expect(productDAO.deleteProduct("testProduct"))
                .rejects
                .toThrowError("Error fo try block")
            mockDBGet.mockRestore()
        })
    })

    describe("TEST deleteAllProducts", () => {
        test("It should return true for delete all products", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })

            const result = await productDAO.deleteAllProducts()
            expect(result).toBe(true)

        mockDBRun.mockRestore()

        })

        test("It should throw an error if database fail to delete all products", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error: Error to delite the product"))
                return {} as Database
            })
            
            await expect(productDAO.deleteAllProducts())
                .rejects
                .toThrowError("Database error: Error to delite the product")

            mockDBRun.mockRestore()
        })

        test(" It should throw an error if throw in the try block", async () => {
            const productDAO = new ProductDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error("Error for try block");
            })

            await expect(productDAO.deleteAllProducts())
                .rejects
                .toThrowError("Error for try block")

            mockDBRun.mockRestore()
        })
    })
})




