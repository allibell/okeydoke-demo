interface QuantityProps {
    quantity: number;
    setQuantity: React.Dispatch<React.SetStateAction<number>>;
}

export const Quantity = ({ quantity, setQuantity }: QuantityProps) => {
    return (
        <div className="flex flex-row h-full w-1/2 rounded-lg relative bg-transparent">
            <button
                data-action="decrement"
                className=" bg-catalog-bg text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-l cursor-pointer outline-none"
                onClick={() => setQuantity((val) => Math.max(val - 1, 1))}
            >
                <span className="m-auto text-2xl font-thin">{"-"}</span>
            </button>
            <input
                type="number"
                className="focus:outline-none select-none pointer-events-none text-center w-full bg-catalog-bg font-semibold text-md text-black  md:text-basecursor-default flex items-center  outline-none"
                name="custom-input-number"
                min={1}
                value={quantity}
            ></input>
            <button
                data-action="increment"
                className="bg-catalog-bg text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-r cursor-pointer"
                onClick={() => setQuantity((val) => val + 1)}
            >
                <span className="m-auto text-2xl font-thin">+</span>
            </button>
        </div>
    );
};
