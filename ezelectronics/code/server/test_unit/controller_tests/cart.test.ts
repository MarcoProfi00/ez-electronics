import { test, expect, jest, describe } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import { User, Role } from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category } from "../../src/components/product"

jest.mock("../../src/dao/cartDAO")

let testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

let testCart1 = new Cart("test", false, "2024-06-07", 0, []);
let testCart2 = new Cart("test", true, "2024-06-04", 850, [new ProductInCart("iphone13", 1, Category.SMARTPHONE, 850)]);
let testCart3 = new Cart("test_all", true, "2024-06-03", 450, [new ProductInCart("xiaomiMi10", 1, Category.SMARTPHONE, 450)]);

describe("Cart Controller Unit Tests", () => {
    describe("AddToCart Method", () => {
        test("It should return true", async () => {
            jest.spyOn(CartDAO.prototype, "addToCurrentCart").mockResolvedValueOnce(true);
    
            const controller = new CartController();
            const response = await controller.addToCart(testUser, testCart2.products[0].model);
            expect(CartDAO.prototype.addToCurrentCart).toHaveBeenCalled();
            expect(CartDAO.prototype.addToCurrentCart).toHaveBeenCalledWith(testUser.username, testCart2.products[0].model);
            expect(response).toBe(true);
        });
    });

    describe("GetCart Method", () => {
        test("It should return the user cart", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockResolvedValueOnce(testCart1);
    
            const controller = new CartController();
            const response = await controller.getCart(testUser);
            expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalled();
            expect(CartDAO.prototype.getCurrentCart).toHaveBeenCalledWith(testUser.username);
            expect(response).toEqual(testCart1);
        });

        test("Should reject on a generic error", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentCart").mockReturnValueOnce(Promise.reject("Generic error"));

            const controller = new CartController();

            await expect(controller.getCart(testUser)).rejects.toEqual("Generic error");
        });
    })

    describe("CheckoutCart Method", () => {
        test("It should return true", async () => {
            jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
    
            const controller = new CartController();
            const response = await controller.checkoutCart(testUser);
            expect(CartDAO.prototype.checkoutCart).toHaveBeenCalled();
            expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testUser.username);
            expect(response).toBe(true);
        });
    })

    describe("GetCustomerCarts Method", () => {
        test("It should return the user carts", async () => {
            jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([testCart2, testCart3]);
    
            const controller = new CartController();
            const response = await controller.getCustomerCarts(testUser);
            expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalled();
            expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser.username);
            expect(response).toEqual([testCart2, testCart3]);
        })
    })

    describe("RemoveProductFromCart Method", () => {
        test("It should return true", async () => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
    
            const controller = new CartController();
            const response = await controller.removeProductFromCart(testUser, testCart2.products[0].model);
            expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
            expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(testUser.username, testCart2.products[0].model);
            expect(response).toBe(true);
        })
    })

    describe("ClearCart Method", () => {
        test("It should return true", async () => {
            jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);
    
            const controller = new CartController();
            const response = await controller.clearCart(testUser);
            expect(CartDAO.prototype.clearCart).toHaveBeenCalled();
            expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testUser.username);
            expect(response).toBe(true);
        })
    })

    describe("DeleteAllCarts Method", () => {
        test("It should return true", async () => {
            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
    
            const controller = new CartController();
            const response = await controller.deleteAllCarts();
            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
            expect(response).toBe(true);
        })
    })

    describe("GetAllCarts Method", () => {
        test("It should return an array of carts", async () => {
            jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce([testCart1, testCart2, testCart3]);
    
            const controller = new CartController();
            const response = await controller.getAllCarts();
            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
            expect(response).toEqual([testCart1, testCart2, testCart3]);
        })
    })

})
