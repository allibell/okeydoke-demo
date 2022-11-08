import { useMemo } from "react";
import { Bookmark, Star } from "react-feather";
import { Product, ProductHeader } from "../../data/products";

import { useAddItem } from "../../hooks/custom/useAddItem";
import { NewSeason } from "./NewSeason";
import { Sale } from "./Sale";

interface CardProps {
  product: Product;
}
export const Card = ({ product }: CardProps) => {
  const addItem = useAddItem();

  return (
    <div
      key={product.id}
      className="flex flex-col items-center gap-3 border p-4 rounded-lg w-full md:h-80 md:w-72 bg-white"
    >
      <div className="flex flex-row w-full items-center justify-between">
        {product.header === ProductHeader.Sale && <Sale />}
        {product.header === ProductHeader.NewSeason && <NewSeason />}
        <Bookmark className="stroke-gray-500 hidden md:block" size={18} />
        <Bookmark className="stroke-gray-500 md:hidden" size={24} />
      </div>

      <div className="flex flex-col items-center w-full pt-3 space-y-3">
        <img className="w-2/3 rounded-lg" src={product.image} />
        <div className="text-xl font-medium text-black ">{product.name}</div>
        <div className="text-md font-light text-gray-500">
          {product.subTitle}
        </div>
        <div className="flex flex-row items-center space-x-4">
          <div className="text-lg font-medium text-black ">
            {product.price.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </div>
          {product.header === ProductHeader.Sale && product.prevPrice && (
            <div className="text-md font-light text-gray-500 line-through">
              {product.prevPrice.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
