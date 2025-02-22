CREATE TABLE Users (
    username TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    address TEXT,
    birthdate TEXT,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT CHECK(role IN ('Customer', 'Manager', 'Admin')) NOT NULL
);

CREATE TABLE Products (
    model TEXT PRIMARY KEY,
    category TEXT CHECK(category IN ('Smartphone', 'Laptop', 'Appliance')) NOT NULL,
    arrivalDate TEXT NOT NULL,
    sellingPrice REAL NOT NULL,
    quantity  INTEGER NOT NULL,
    details TEXT
);

CREATE TABLE Carts (
    cart_id  INTEGER PRIMARY KEY  ,
    username TEXT NOT NULL,
    paid  INTEGER DEFAULT 0 CHECK(paid IN (0, 1)) NOT NULL,
    paymentDate TEXT,
    total REAL,
    FOREIGN KEY (username) REFERENCES Users(username)
);

CREATE TABLE Cart_Product (
    cart_id  INTEGER NOT NULL,
    model TEXT NOT NULL,
	quantity INTEGER NOT NULL,
    PRIMARY KEY (cart_id, model),
    FOREIGN KEY (cart_id) REFERENCES Carts(cart_id),
    FOREIGN KEY (model) REFERENCES Products(model)
);

CREATE TABLE Reviews (
    model TEXT NOT NULL,
    username TEXT NOT NULL,
    score  INTEGER CHECK(score IN('1', '2', '3', '4', '5')) NOT NULL,
    date TEXT NOT NULL,
    comment TEXT,
	PRIMARY KEY (model, username),
    FOREIGN KEY (model) REFERENCES Products(model),
    FOREIGN KEY (username) REFERENCES Users(username)
);