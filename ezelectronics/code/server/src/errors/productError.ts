const PRODUCT_NOT_FOUND = "Product not found"
const PRODUCT_ALREADY_EXISTS = "The product already exists"
const PRODUCT_SOLD = "Product already sold"
const EMPTY_PRODUCT_STOCK = "Product stock is empty"
const LOW_PRODUCT_STOCK = "Product stock cannot satisfy the requested quantity"
const CHANGE_DATE_BEFORE_ARRIVAL_DATE = "Change date cannot be before arrival date"
const SELLING_DATE_BEFORE_ARRIVAL_DATE = "Selling date cannot be before arrival date"

/**
 * Represents an error that occurs when a product is not found.
 */
class ProductNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product id already exists.
 */
class ProductAlreadyExistsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_ALREADY_EXISTS
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is already sold.
 */
class ProductSoldError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_SOLD
        this.customCode = 409
    }
}

class EmptyProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_PRODUCT_STOCK
        this.customCode = 409
    }
}

class LowProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = LOW_PRODUCT_STOCK
        this.customCode = 409
    }
}

class ChangeDateBeforeArrivalDate extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = CHANGE_DATE_BEFORE_ARRIVAL_DATE
        this.customCode = 400
    }
}

class SellingDateBeforeArrivalDate extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = SELLING_DATE_BEFORE_ARRIVAL_DATE
        this.customCode = 400
    }
}

export { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, ChangeDateBeforeArrivalDate, SellingDateBeforeArrivalDate }