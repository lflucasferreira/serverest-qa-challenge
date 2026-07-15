const { faker } = require('@faker-js/faker');

const uniqueSuffix = () => `${Date.now()}${faker.number.int({ min: 100, max: 999 })}`;

function buildUser({ administrador = false } = {}) {
  return {
    nome: faker.person.fullName(),
    email: `qa.${uniqueSuffix()}.${faker.internet.username().toLowerCase()}@teste.com`,
    password: faker.internet.password({ length: 10 }),
    administrador: administrador ? 'true' : 'false',
  };
}

function buildProduct() {
  return {
    nome: `${faker.commerce.productName()} ${uniqueSuffix()}`,
    preco: faker.number.int({ min: 10, max: 500 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 1, max: 50 }),
  };
}

module.exports = { buildUser, buildProduct };
