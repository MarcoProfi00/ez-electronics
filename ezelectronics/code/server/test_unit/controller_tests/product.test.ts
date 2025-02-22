import { test, expect, jest, describe } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import { User, Role } from "../../src/components/user"
import { Category, Product } from "../../src/components/product"
import exp from "constants"

jest.mock("../../src/dao/productDAO")

const controller = new ProductController()

let testProduct1 = new Product(100, "testProduct1", Category.SMARTPHONE, "2024-06-10", "", 2)
let testProduct2 = new Product(1000, "testProduct2", Category.LAPTOP, "2024-06-10", "", 4)

describe("Product Controller Unit Tests", () => {
    
    describe("registerProducts Method", () => {
        test("It should return void", async () => {
            jest.spyOn(ProductDAO.prototype, "addNewProduct").mockResolvedValueOnce()

            const response = await controller.registerProducts(testProduct1.model, testProduct1.category, testProduct1.quantity, testProduct1.details, testProduct1.sellingPrice, testProduct1.arrivalDate)
            expect(ProductDAO.prototype.addNewProduct).toHaveBeenCalled()
            expect(ProductDAO.prototype.addNewProduct).toHaveBeenCalledWith(testProduct1.model, testProduct1.category, testProduct1.quantity, testProduct1.details, testProduct1.sellingPrice, testProduct1.arrivalDate)
            expect(response).toBe(undefined)
            
        })
    })

    describe("changeProductQuantity Method", () => {
        test("It should return the new quantity of the product", async() => {
            let newQuantity = 6
            jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue({quantity: newQuantity})

            const response = await controller.changeProductQuantity(testProduct1.model, 4, "2024-06-10")
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(testProduct1.model, 4, "2024-06-10")
            expect(response).toEqual({ quantity: newQuantity  })
        })
    })

    describe("sellProduct Method", () => {
        test("It should return void", async() => {
            jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce()

            const response = await controller.sellProduct(testProduct1.model, 1, "2024-06-10")
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(testProduct1.model, 1, "2024-06-10")
            expect(response).toBe(undefined)
        })
    })

    describe("getProducts Method", () => {
        test("It should return all products when grouping is null", async() =>{
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([testProduct1, testProduct2])

            const response = await controller.getProducts(null, null, null)
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalled()
            expect(response).toEqual([testProduct1, testProduct2])
        })

        test("It should return products by category when grouping is 'category'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([testProduct1])
    
            const response = await controller.getProducts("category", Category.SMARTPHONE, null);
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith(Category.SMARTPHONE, false)
            expect(response).toEqual([testProduct1])
        })

        test("It should return product by model when grouping is 'model'", async () => {
            const model = "testProduct2";
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([testProduct2])
    
            const response = await controller.getProducts("model", null, model);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(model, false)
            expect(response).toEqual([testProduct2])
        })
    })

    describe("getAvailableProducts Method", () => {
        test("It should return all products available when grouping is null", async() =>{
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValueOnce([testProduct1, testProduct2])

            const response = await controller.getAvailableProducts(null, null, null)
            expect(ProductDAO.prototype.getAllProducts).toHaveBeenCalled()
            expect(response).toEqual([testProduct1, testProduct2])
        })

        test("It should return products by category when grouping is 'category'", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory").mockResolvedValueOnce([testProduct1])
    
            const response = await controller.getAvailableProducts("category", Category.SMARTPHONE, null);
            expect(ProductDAO.prototype.getProductsByCategory).toHaveBeenCalledWith(Category.SMARTPHONE, false)
            expect(response).toEqual([testProduct1])
        })

        test("It should return product by model when grouping is 'model'", async () => {
            const model = "testProduct2";
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce([testProduct2])
    
            const response = await controller.getAvailableProducts("model", null, model);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(model, false)
            expect(response).toEqual([testProduct2])
        })
    })

    //Dovrebbe ritornare true nel controller
    describe("deleteAllProducts Method", () => {
        test("It should delete all products", async () => {
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

            const response = await controller.deleteAllProducts()
    
            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalled()
            expect(response).toBe(true)
        })
    })

    describe("deleteProduct Method", () => {
        test("It should delete the product with the specified model", async () => {

            jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true);
    
            const response = await controller.deleteProduct(testProduct1.model);
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith(testProduct1.model);
            expect(response).toBe(true);
        });
    });

})