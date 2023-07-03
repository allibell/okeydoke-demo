import { AnimatePresence, motion } from "framer-motion";
import { X } from "react-feather";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { useState, useMemo, useEffect } from "react";
import { useMutation } from "react-query";
import { isLocalStorageModalVisibleState} from "../../../atoms/modals";
import { useLockBg } from "../../../hooks/custom/useLockBackground";
import {  startAuthentication } from "@simplewebauthn/browser";
import { Credential } from "./Credential";
import EmailInput from "../../../layouts/LandingPage/IssueModal/EmailInput";
import { CredentialDerivedProof } from "../../../models/credential";


const Animations = {
    container: {
        hidden: {
            opacity: 0,
        },
        visible: {
            opacity: 1,
        },
    },
    inputContainer: {
        hidden: {
            y: 200,
            opacity: 0,
        },
        visible: {
            y: 0,
            opacity: 1,
        },
    },
    item: {
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: -100 },
    },
    filterText: {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    },
};


export const validateEmail = (email: string) => {
    let regexEmail =
        /(?:[a-z0-9!#$%&"*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&"*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (email.match(regexEmail)) {
        return true;
    } else {
        return false;
    }
};

export const LocalStorageModal = () => {
    const [userEmail, setUserEmail] = useState("");
    const [credentialsVisible, setCredentialsVisible] = useState(false);
    const [credentials, setCredentials] = useState<Array<any>>([]);

    const navigate = useNavigate();

    const isEmailValid = useMemo(() => {
        if (userEmail.length === 0) return true;
        return validateEmail(userEmail);
    }, [userEmail]);


    const {
        isLoading,
        error,
        isError,
        isSuccess,
        reset,
        mutate: webauthnReadLargeBlob,
    } = useMutation((email: string) =>
        handleWebauthnReadLargeBlob(userEmail)
    );

    useEffect(() => {
        if (isSuccess && credentials.length > 0) {
            setCredentialsVisible(true);
            console.log("🔑📄 Verifiable Credentials", credentials);
        }
    }, [isSuccess, credentials]);

    const buttonEnabled = useMemo(() => {
        return (
            !isLoading && isEmailValid && userEmail.length > 0
        );
    }, [isLoading, isEmailValid, userEmail]);

    const handleWebauthnReadLargeBlob = async (email: string) => {
        const assertionOptionsResp = await fetch("https://localhost:44329/assertionOptions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: email })
        });
        const optsJson = await assertionOptionsResp.json();
        console.log("assertionOptionsResp", assertionOptionsResp, optsJson);
        var newOpts = optsJson;
        newOpts.extensions.largeBlob = { read: true };
        console.log("newOpts", newOpts);
        const assertionResp = await startAuthentication(newOpts);
        console.log("Assertion Response", JSON.stringify(assertionResp, null, 2));
    
        const authenticationResp = await fetch("https://localhost:44329/makeAssertion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Attestation-Options": JSON.stringify(newOpts)
            },
            body: JSON.stringify(assertionResp),
        });
        const authenticationRespJSON = await authenticationResp.json();
        if (authenticationRespJSON && authenticationRespJSON.status === "ok") {
            console.log("Authenticator authenticated!");
            console.log("Authentication Response", JSON.stringify(authenticationRespJSON, null, 2));

            const blob = assertionResp.clientExtensionResults?.largeBlob?.blob;
            const encCredential = localStorage.getItem("encCredential");
            console.log("🔒 Encrypted credential (from localStorage): ", blob, encCredential);
            if (blob && encCredential) {
                // we have our AES key and its encrypted data!
                const jwk = JSON.parse(new TextDecoder().decode(new Uint8Array(blob)));
                console.log("🔑 AES key as JWK (from largeBlob)", jwk);
                const encKey = await crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);

                const credentialMessage = JSON.parse(encCredential);
                const encryptedData = new Uint8Array(credentialMessage.data);
                const nonce = new Uint8Array(credentialMessage.iv);
                const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, encKey, encryptedData);
                const credential = JSON.parse(new TextDecoder().decode(decrypted));
                console.log("🚨 🥳 🔑 Decrypted credential", credential);
                setCredentials([credential]);

            }
        }
    }


    return (
        <div className="max-w-x2s overflow-hidden md:max-w-xs">
            <AnimatePresence>
                {!credentialsVisible ? (
                    <motion.div
                        className="fixed top-0 bottom-0 left-0 right-0 z-20 flex items-center justify-center"
                        variants={Animations.container}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="z-40 flex w-full items-center justify-center p-4">
                            <motion.div
                                className="w-full max-w-md rounded-lg bg-white shadow-lg"
                                variants={Animations.inputContainer}
                            >
                                <div className="p-4 md:p-6">
                                    <div className="mt-4 flex w-full flex-col items-start space-y-4 pt-2">
                                        <div className="w-full">
                                            <EmailInput
                                                value={userEmail}
                                                onChange={setUserEmail}
                                                isValid={isEmailValid}
                                            />
                                            <button
                                                className={`group flex h-full w-full flex-row items-center space-x-6 rounded-lg
                                                px-4 py-3 text-white ${
                                                    buttonEnabled
                                                        ? "bg-blue-500 hover:border-2 hover:border-blue-500 hover:bg-white hover:py-2.5 hover:text-blue-500"
                                                        : "bg-blue-300"
                                                }`}
                                                onClick={() => {
                                                    webauthnReadLargeBlob(userEmail);
                                                    setCredentialsVisible(true);
                                                }}
                                                disabled={!buttonEnabled}
                                            >
                                                <div className="flex-1 pr-12 text-lg font-medium">
                                                    Authenticate
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        className="fixed top-0 bottom-0 left-0 right-0 z-20 flex items-center justify-center"
                        variants={Animations.container}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="z-40 flex w-full items-center justify-center p-4">
                            <motion.div
                                className="w-full max-w-md rounded-lg bg-white shadow-lg"
                                variants={Animations.inputContainer}
                            >
                                <div className="p-4 md:p-6">
                                    <div className="mt-4 flex w-full flex-col items-start space-y-4 pt-2">
                                        <div className="w-full">
                                            <h6 className="text-xl font-semibold text-black">
                                                Your credentials:
                                            </h6>
                                            <motion.div
                                                className="flex h-full flex-col items-start space-y-4 overflow-y-scroll p-4 pb-12 md:flex-row md:flex-wrap md:gap-4 md:space-y-0"
                                                key="container"
                                                variants={Animations.container}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                            >
                                                {credentials.map((credential: any) => {
                                                    const typedCredential = credential as CredentialDerivedProof;
                                                    console.log("typedCredential", typedCredential);
                                                    return (
                                                        <motion.div
                                                            // variants={Animations.item}
                                                            key={typedCredential.issuanceDate}
                                                            className="flex w-full flex-col items-center rounded-lg hover:shadow-m"
                                                        >
                                                            <Credential
                                                                credential={typedCredential}
                                                            />
                                                        </motion.div>
                                                    )
                                                })}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};