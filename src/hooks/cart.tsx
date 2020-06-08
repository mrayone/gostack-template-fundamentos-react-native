import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsSerialized = await AsyncStorage.getItem(
        '@GoMarketPlace:cart',
      );

      if (productsSerialized) {
        const productsStored = JSON.parse(productsSerialized) as Product[];
        setProducts([...productsStored]);
      }
    }

    loadProducts();
  }, []);

  const handleAsyncStorage = useCallback(async () => {
    await AsyncStorage.setItem('@GoMarketPlace:cart', JSON.stringify(products));
  }, [products]);

  const increment = useCallback(
    async id => {
      const productFinded = products.findIndex(cartItem => cartItem.id === id);
      if (productFinded >= 0) {
        const product = products[productFinded];
        const newProducts = products.slice();
        product.quantity += 1;
        newProducts.splice(productFinded, 1, product);
        setProducts(newProducts);

        await handleAsyncStorage();
      }
    },
    [products, handleAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const productFinded = products.findIndex(cartItem => cartItem.id === id);
      if (productFinded >= 0) {
        const product = products[productFinded];
        const newProducts = products.slice();
        product.quantity -= 1;
        if (product.quantity === 0) {
          newProducts.splice(productFinded, 1);
          setProducts(newProducts);
        } else {
          newProducts.splice(productFinded, 1, product);
          setProducts(newProducts);
        }

        await handleAsyncStorage();
      }
    },
    [products, handleAsyncStorage],
  );

  const addToCart = useCallback(
    async ({ id, title, price, image_url, quantity = 0 }: Product) => {
      const productFinded = products.findIndex(cartItem => cartItem.id === id);
      if (productFinded >= 0) {
        increment(id);
      } else {
        setProducts([
          ...products,
          {
            id,
            title,
            price,
            image_url,
            quantity: quantity + 1,
          },
        ]);
      }
      await handleAsyncStorage();
    },
    [increment, setProducts, handleAsyncStorage, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
