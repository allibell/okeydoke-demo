import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { Bookmark, ShoppingCart, Star } from "react-feather";
import { useRecoilState, useRecoilValue } from "recoil";
import { memberLevelState, memberProduceState } from "../../atoms/member";
import { filterProductsState } from "../../atoms/products";
import { userCredentialState } from "../../atoms/user";
import { VerifyCredential } from "../../components/BetterDeal";
import { Product, ProductHeader } from "../../data/products";

import { useAddItem } from "../../hooks/custom/useAddItem";
import {
    applyBronzeDiscount,
    applyGoldDiscount,
    applySilverDiscount,
} from "../../utils/goldDiscount";
import { BronzeMember } from "./BronzeMember";
import { CardButtons } from "./CardButtons";
import { GoldMember } from "./GoldMember";
import { NewSeason } from "./NewSeason";
import { Sale } from "./Sale";
import { SilverMember } from "./SilverMember";

const Animations = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -100 },
};

export interface CardProps {
    product: Product;
    isGoldMember: boolean;
    isSilverMember: boolean;
    isBronzeMember: boolean;
}
export const Card = ({
    product,
    isGoldMember,
    isSilverMember,
    isBronzeMember,
}: CardProps) => {
    const isMember = useMemo(
        () => isBronzeMember || isSilverMember || isGoldMember,
        [isBronzeMember, isSilverMember, isGoldMember]
    );

    const memberAdjustment = useMemo(() => {
        if (!isMember) return undefined;

        if (isGoldMember)
            return {
                goldPrice: applyGoldDiscount(product.price),
                prevPrice: product.price,
            };
        if (isSilverMember)
            return {
                goldPrice: applySilverDiscount(product.price),
                prevPrice: product.price,
            };
        if (isBronzeMember)
            return {
                goldPrice: applyBronzeDiscount(product.price),
                prevPrice: product.price,
            };
    }, [product, isMember, isGoldMember, isSilverMember, isBronzeMember]);

    return (
        <AnimatePresence>
            <motion.div
                variants={Animations}
                initial={Animations.hidden}
                animate={Animations.visible}
                exit={Animations.hidden}
                key={product.id + "child"}
                className="flex flex-col items-center gap-3 border p-4 rounded-lg w-full md:max-w-md bg-white"
            >
                <div className="flex flex-row w-full items-center justify-between h-12">
                    {product.header === ProductHeader.Sale &&
                        product.discount &&
                        !isMember && <Sale discount={product.discount} />}
                    {product.header === ProductHeader.NewSeason &&
                        !isMember && <NewSeason />}
                    {memberAdjustment && isGoldMember && <GoldMember />}
                    {memberAdjustment && isSilverMember && <SilverMember />}
                    {memberAdjustment && isBronzeMember && <BronzeMember />}
                    <VerifyCredential />
                </div>

                <div className="flex flex-col items-center w-full pt-3 space-y-3 pb-3">
                    <img
                        className="w-2/3 max-h-36 rounded-lg"
                        src={product.image}
                    />
                    <div className="text-xl font-medium text-black ">
                        {product.name}
                    </div>
                    <div className="text-md font-light text-gray-500">
                        {product.subTitle}
                    </div>

                    {!isMember && (
                        <div className="flex flex-row items-center space-x-4">
                            <div
                                className={`text-lg font-medium ${
                                    product.header === ProductHeader.Sale
                                        ? "text-red-600"
                                        : "text-black"
                                }`}
                            >
                                {product.price.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}
                            </div>
                            {product.header === ProductHeader.Sale &&
                                product.prevPrice && (
                                    <div className="text-md font-light text-gray-500 line-through">
                                        {product.prevPrice.toLocaleString(
                                            "en-US",
                                            {
                                                style: "currency",
                                                currency: "USD",
                                            }
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                    {isGoldMember && memberAdjustment && (
                        <div className="flex flex-row items-center space-x-4">
                            <div className="text-lg font-medium text-yellow-600 ">
                                {memberAdjustment.goldPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                            <div className="text-md font-light text-gray-500 line-through">
                                {memberAdjustment.prevPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                        </div>
                    )}
                    {isSilverMember && memberAdjustment && (
                        <div className="flex flex-row items-center space-x-4">
                            <div className="text-lg font-medium text-gray-600 ">
                                {memberAdjustment.goldPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                            <div className="text-md font-light text-gray-400 line-through">
                                {memberAdjustment.prevPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                        </div>
                    )}
                    {isBronzeMember && memberAdjustment && (
                        <div className="flex flex-row items-center space-x-4">
                            <div className="text-lg font-medium text-amber-600 ">
                                {memberAdjustment.goldPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                            <div className="text-md font-light text-gray-500 line-through">
                                {memberAdjustment.prevPrice.toLocaleString(
                                    "en-US",
                                    {
                                        style: "currency",
                                        currency: "USD",
                                    }
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <CardButtons product={product} />
            </motion.div>
        </AnimatePresence>
    );
};
