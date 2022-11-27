const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Validation functions
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: propertyName });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (Number.isInteger(price) && Number(price) > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Given price is ${
      Number.isInteger(price) ? `not an integer` : `equal to or less than $0.00`
    }`,
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;

  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found ${dishId}`,
  });
}

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: dishes });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);

  res.status(201).json({ data: newDish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create,
  ],
  read: [dishExists, read],
};
