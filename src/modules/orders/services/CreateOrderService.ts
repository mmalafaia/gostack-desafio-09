import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists');
    }

    const mapProductsIds = products.map(product => ({
      id: product.id,
    }));

    const findProductsPrice = await this.productsRepository.findAllById(
      mapProductsIds,
    );

    if (findProductsPrice.length !== mapProductsIds.length) {
      throw new AppError('Product does not exists');
    }

    const productsOrder = products.map(
      product => {
        const checkProductPrice = findProductsPrice.find(
          findProductPrice => findProductPrice.id === product.id,
        );

        if (
          checkProductPrice &&
          checkProductPrice.quantity < product.quantity
        ) {
          throw new AppError(
            `Producs ${checkProductPrice.name} does not have enough quantity.`,
          );
        }

        return {
          product_id: product.id,
          price: checkProductPrice?.price || 0,
          quantity: product.quantity,
        };
      },
      {
        product_id: '',
        price: 0,
        quantity: 0,
      },
    );

    const order = await this.ordersRepository.create({
      customer,
      products: productsOrder,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
