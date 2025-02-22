import { test, expect, jest, describe } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user"
import { UserNotAdminError } from "../../src/errors/userError"
import { truncate } from "fs"


jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

const controller = new UserController();
let testUser1 = new User("test1", "test1", "test1", Role.MANAGER, "test1", "test1")
let testUser2 = new User("test2", "test2", "test2", Role.CUSTOMER, "test2", "test2")
let testUserAdmin = new User("test3", "test3", "test3", Role.ADMIN, "test3", "test3")

describe("User Controller Unit Test", () => {
    describe("createUser Method", () => {
        test("It should return true", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }

            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true)
            const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)
        
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)
            expect(response).toBe(true)
        })
    })

    describe("getUsers Method", () => {
        test("It should return an Array of User", async() => {
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValue([testUser1, testUser2])

            const response = await controller.getUsers()
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled()
            expect(response).toEqual([testUser1, testUser2])
        })
    })

    describe("getUsersByRole Method", () => {
        test("It should return an Array of User", async() => {
            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValue([testUser1])

            const response = await controller.getUsersByRole("Customer")
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled()
            expect(response).toEqual([testUser1])
        })
    })

    describe("getUsersByUsername Method", () => {
        test("It should return an object of User if the user is Admin", async() => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testUser1)

            const response = await controller.getUserByUsername(testUserAdmin, "test1")
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled()
            expect(response).toEqual(testUser1)
        })

        test("It should return an object of User with his information if the user is not Admin", async() => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(testUser2)

            const response = await controller.getUserByUsername(testUser2, "test2")
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled()
            expect(response).toEqual(testUser2)
        })

        /* Il controllo sull'Admin o altro utente che chiama la funzione lo mettiamo nelle Route
        test("It should throw UserNotAdminError if the user is not Admin and tries to retrieve another user", async () => {         
            const response = await controller.getUserByUsername(testUser1, "test2")
            expect(response).toEqual(new UserNotAdminError)
        });
        */
    })

    describe("deleteUser Method", () => {
        test("It should return true if Admin delete an user", async() => {
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValue(true)

            const response = await controller.deleteUser(testUserAdmin, "test1")
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalled()
            expect(response).toEqual(true)
        })

        test("It should return true if user delet themselves", async() => {
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValue(true)

            const response = await controller.deleteUser(testUser2, "test2")
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled()
            expect(response).toEqual(true)
        })

        /* Il controllo sull'Admin o altro utente che chiama la funzione lo mettiamo nelle Route
        test("It should throw UnauthorizedUserError if the user is not Admin and tries to delete another user", async () => {         
            const response = await controller.deleteUser(testUser2, "test1")
            expect(response).toEqual(new UserNotAdminError)
        });
        */
    })

    describe("deleteAll Method", () => {
        test("It should return true if all non-Admin users have been deleted", async() => {
            jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValue(true)

            const response = await controller.deleteAll()
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalled()
            expect(response).toEqual(true)
        })
    })

    describe("updateuserInfo Method", () => {
        test("It should return an object of User updated", async() => {
            let updatedUser = new User("test1", "testUpdated", "testUpdated", Role.CUSTOMER, "testUpdated", "2024-06-11")
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValue(updatedUser)

            const response = await controller.updateUserInfo(testUser1,"testUpdated", "testUpdated", "testUpdated", "2024-06-11", "test1")
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalled()
            expect(response).toEqual(updatedUser)
        })
    })
})

