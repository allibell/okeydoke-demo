import ActionList from "./ActionList";
import { IssueModal } from "./IssueModal";
import { SuccessModal } from "./IssueModal/SuccessModal";
import { useState } from "react";

const LandingPage = () => {
    const [farmerName, setFarmerName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [grade, setGrade] = useState("A");
    const [produceType, setProduceType] = useState("Artichoke");

    const handleUserEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserEmail(event.target.value);
      };
    const handleFarmerNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFarmerName(event.target.value);
    };

    return (
        <div className="h-full w-full bg-light-bg">
            <div className="p-8 md:p-12">
                <div className="flex flex-col items-start gap-2">
                    <div className="text-4xl font-medium md:text-7xl">
                        OkeyDoke
                    </div>
                    <div className="pt-4 md:text-xl">
                        OkeyDoke is a network of verified farmers who get access
                        to exclusive discounts and opportunities.
                    </div>
                    <ActionList />
                </div>
                <div id="footer" className="">
                    OkeyDoke is a demo IDtech ecosystem for Trinsic.{" "}
                    <a
                        className="cursor-pointer text-text-inactive hover:text-text-active"
                        target="_blank"
                        href="https://github.com/trinsic-id/okeydoke-demo"
                    >
                        View the source on GitHub
                    </a>
                </div>
            </div>
            <IssueModal 
                userEmail={userEmail} farmerName={farmerName} 
                grade={grade} produceType={produceType} 
                setUserEmail={setUserEmail} setFarmerName={setFarmerName}
                setGrade={setGrade} setProduceType={setProduceType}
            />
            <SuccessModal userEmail={userEmail} farmerName={farmerName} />
        </div>
    );
};

export default LandingPage;
