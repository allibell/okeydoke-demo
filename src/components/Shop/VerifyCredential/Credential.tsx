import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import {
    isRedirectErrorModalVisibleState,
    isRedirectVerifyCredentialErrorState,
    isVerifiedCredentialModalVisibleState,
} from "../../../atoms/modals";
import {
    AuthState,
    authStateState,
    userCredentialState,
} from "../../../atoms/user";
import { authSettingsState } from "../../../atoms/authService";
import { useToggle } from "react-use";
import { VerifyCredential } from "../../../components/Shop/BetterDeal";
import { Product, ProductHeader } from "../../../data/products";
import { useRecoilState, useRecoilValue } from "recoil";
import { useVerifyCredential } from "../../../hooks/queries/useVerifyCredential";
import { CredentialDerivedProof } from "../../../models/credential";


const Animations = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -100 },
};


export const Credential = ({credential}: {credential: CredentialDerivedProof}) => {

    const [hoverPos, setHoverPos] = useState<number | undefined>(undefined);
    const [isVerifyingLoading, toggleVerifyingLoading] = useToggle(false);
    const [isErrorVisible, setModalVisible] = useRecoilState(
        isRedirectErrorModalVisibleState
    );
    const setIsVerifyCredentialError = useSetRecoilState(
        isRedirectVerifyCredentialErrorState
    );
    const navigate = useNavigate();
    const [authState, setAuthState] = useRecoilState(authStateState);
    const [userCredential, setUserCredential] =
        useRecoilState(userCredentialState);
    const authSettings = useRecoilValue(authSettingsState);
    const setVerifiedModalVisible = useSetRecoilState(
        isVerifiedCredentialModalVisibleState
    );
    const { mutateAsync: verifyCredentialAsync } = useVerifyCredential(() => {
        setModalVisible(true);
        setIsVerifyCredentialError(true);
    });

    const credentialSubject = credential.credentialSubject;

    return (
        <div className="flex w-full flex-col items-start gap-1 rounded-lg bg-white p-4">
            <div className="flex flex-row items-center justify-between">
                <button
                    className={`group flexflex-row items-center space-x-6 rounded-lg
                    px-4 py-3 text-white  bg-blue-500 hover:border-2 hover:border-blue-500 hover:bg-white hover:py-2.5 hover:text-blue-500`}
                    onClick={async () => {
                        const verifyResp = await verifyCredentialAsync({
                            derivedProof: credential,
                        });
                        console.log("verifyResp", verifyResp);

                        if (
                            // verifyResp.isValid &&
                            verifyResp.validationResults["CredentialStatus"]
                                .isValid &&
                            verifyResp.validationResults["IssuerIsSigner"]
                                .isValid &&
                            verifyResp.validationResults["SignatureVerification"]
                                .isValid
                        ) {
                            setUserCredential(credential);
                            toggleVerifyingLoading(true);
                            setAuthState(AuthState.VERIFIED);
                            setVerifiedModalVisible(true);
                            return navigate("/shop");
                    }}}
                >
                    <div className="flex-1 pr-12 text-lg font-medium">
                        Share
                    </div>
                </button>
            </div>
        </div>
    );
};
