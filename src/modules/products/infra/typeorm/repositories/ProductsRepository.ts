import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsByIds = await this.ormRepository.findByIds(products);

    return productsByIds;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = products.map<IFindProducts>(product => ({
      id: product.id,
    }));

    const productsByIds = await this.ormRepository.findByIds(productsIds);

    const productsToUpdate = productsByIds.map(productById => {
      const orderProduct = products.find(
        product => product.id === productById.id,
      );

      const quantity = productById.quantity - (orderProduct?.quantity || 0);

      return {
        ...productById,
        quantity,
      };
    });

    const updatedProducts = await this.ormRepository.save(productsToUpdate);

    return updatedProducts;
  }
}

export default ProductsRepository;
