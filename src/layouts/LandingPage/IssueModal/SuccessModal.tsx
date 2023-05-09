import { AnimatePresence, motion } from "framer-motion";
import { X } from "react-feather";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { useState } from "react";
import { isIssueSuccessModalVisibleState } from "../../../atoms/modals";
import { useLockBg } from "../../../hooks/custom/useLockBackground";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";


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
};

/**
     * This value is for sake of demonstration. Pick 32 random
     * bytes. `salt` can be static for your site or unique per
     * credential depending on your needs.
*/
const FIRST_SALT = new Uint8Array(32).fill(68).buffer;

const webauthnRegister = async (email: string, name: string) => {

    const makeCredentialOptionsResp = await fetch("https://localhost:44329/makeCredentialOptions", { 
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: email,
            displayName: name,
        }),
        // TODO: use cookie instead of 'Attestation-Options' header
        // credentials: 'include'
    });
    const optsJson = await makeCredentialOptionsResp.json();
    console.log("makeCredentialOptionsResp", makeCredentialOptionsResp, optsJson);
    var newOpts = optsJson;
    newOpts.extensions.largeBlob = { support: 'required' }
    newOpts.extensions.prf = { eval: { first: FIRST_SALT } }
    console.log("newOpts", newOpts)

    const attestationResp = await startRegistration(newOpts);
    console.log("attestationResp", attestationResp);
    // Simply log the supported extensions
    // TODO: add actual logic to use when supported (e.g. actually use PRF)
    if (attestationResp.clientExtensionResults.largeBlob.supported === true) {
        console.log("🥳 Largeblob supported!")
    } else {
        console.log("😢 Largeblob not supported!")
    }
    if (attestationResp.clientExtensionResults.prf.enabled === true) {
        console.log("🥳 PRF supported!")
    } else {
        console.log("😢 PRF not supported!")
    }

    // not sure if this is the same as /verify-credential in MySimpleWebAuthN
    const registrationResp = await fetch('https://localhost:44329/makeCredential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Attestation-Options': JSON.stringify(newOpts)
        },
        body: JSON.stringify(attestationResp),
        // TODO: use cookie instead of 'Attestation-Options' header
        // credentials: 'include'
      });

    const registrationJSON = await registrationResp.json();
    console.log('Registration Response', JSON.stringify(registrationJSON, null, 2));
    if (registrationJSON && registrationJSON.status === 'ok') {
        console.log(`Authenticator registered!`);
    }
    return registrationJSON;

}

const webauthnWriteLargeBlob = async (email: string, credentialJson: string) => {
    // TODO: support deriving a key from prf
    const encKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const largeBlobBytes = new TextEncoder().encode(JSON.stringify(await crypto.subtle.exportKey("jwk", encKey)));
    const assertionOptionsResp = await fetch("https://localhost:44329/assertionOptions", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email })
    });
    const optsJson = await assertionOptionsResp.json();
    console.log("assertionOptionsResp", assertionOptionsResp, optsJson);
    var newOpts = optsJson;
    newOpts.extensions.prf = { eval: { first: FIRST_SALT } };
    newOpts.extensions.largeBlob = { write: largeBlobBytes };
    console.log("newOpts", newOpts);
    const assertionResp = await startAuthentication(newOpts);
    console.log('Assertion Response', JSON.stringify(assertionResp, null, 2));

    const authenticationResp = await fetch('https://localhost:44329/makeAssertion', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Attestation-Options': JSON.stringify(newOpts)
        },
        body: JSON.stringify(assertionResp),
    });
    const authenticationRespJSON = await authenticationResp.json();
    if (authenticationRespJSON && authenticationRespJSON.status === 'ok') {
        console.log(`Authenticator authenticated!`);
        console.log('🪩🍾 Authentication Response', JSON.stringify(authenticationRespJSON, null, 2));

        // Keep track of this `nonce`, you'll need it to decrypt later!
        // FYI it's not a secret so you don't have to protect it.
        console.log(`🚨 encrypting credentialJson`, credentialJson)
        const nonce = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce },
            encKey,
            new TextEncoder().encode(credentialJson),
        );
        const messageObject = { data: Array.from(new Uint8Array(encrypted)), iv: Array.from(nonce) };
        localStorage.setItem("encCredential", JSON.stringify(messageObject));
    }
    // return asserti;

}

const sendEmail = async (email: string, credentialJson: string) => {
    let url = `https:/localhost:7133/api/send`
        + `?email=${encodeURIComponent(email)}`
        + `&documentJson=${encodeURIComponent(credentialJson)}`;
    const response = await fetch(url, { method: "POST" });
    let json = await response.json();
    if (!json.success) {
        throw new Error(json.error)
    }
    else {
        return json;
    }
}

interface SuccessModalState {
    farmerName: string;
    userEmail: string;
    credentialJson: string;
  }

export const SuccessModal = ({ farmerName, userEmail, credentialJson }: SuccessModalState) => {
    const [isVisible, setModalVisible] = useRecoilState(
        isIssueSuccessModalVisibleState
    );
    const [credentialSendSuccess, setCredentialSendSuccess] = useState(false);

    useLockBg(isVisible);
    const navigate = useNavigate();

    return (
        <div className="max-w-x2s overflow-hidden md:max-w-xs">
            <AnimatePresence>
                {isVisible ? (
                    <motion.div
                        className="fixed top-0 bottom-0 left-0 right-0 z-20 flex items-center justify-center"
                        variants={Animations.container}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {credentialSendSuccess ? (
                            <div
                                className="absolute top-0 bottom-0 left-0 right-0 z-30 cursor-pointer bg-black bg-opacity-50"
                                onClick={() => {
                                    navigate("/shop/catalog");
                                    setModalVisible(false);
                                }}
                            ></div>
                        ) : (
                            <div
                                className="absolute top-0 bottom-0 left-0 right-0 z-30 cursor-pointer bg-black bg-opacity-50"
                            ></div>
                        )}
                        <div className="z-40 flex w-full items-center justify-center p-4">
                            <motion.div
                                className="w-full max-w-md rounded-lg bg-white shadow-lg"
                                variants={Animations.inputContainer}
                            >
                                <div className="flex w-full flex-col items-start gap-4 p-4 md:p-6">
                                    <div className="flex w-full flex-row items-start justify-between">
                                        <div className="flex flex-row items-center">
                                            <h6 className="text-xl font-semibold text-black">
                                                Success
                                            </h6>
                                        </div>
                                        {credentialSendSuccess ? (
                                            <button
                                                className="ml-6 text-gray-50 focus:outline-none"
                                                onClick={() => {
                                                    navigate("/shop/catalog");
                                                    setModalVisible(false);
                                                }}
                                                >
                                                <X
                                                    className="stroke-black hover:stroke-red-500"
                                                    size={20}
                                                />
                                            </button>
                                        ) : null
                                        }
                                    </div>
                                    {credentialSendSuccess ? (
                                        <div className="flex w-full flex-col items-start gap-4 p-4 md:p-6">
                                        <div className="w-full text-lg">
                                            Your credential was stored successfully!
                                        </div>
                                        <button
                                            className={`group flex h-full w-full flex-row items-center space-x-6 rounded-lg
                                                bg-blue-500 px-4 py-3 text-white hover:border-2 hover:border-blue-300 hover:bg-white hover:py-2.5 hover:text-blue-500`}
                                            onClick={async () => {
                                                navigate("/shop/catalog");
                                                setModalVisible(false);
                                            }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src="images/trinsic-logo-white.png"
                                                    className={`block w-6 group-hover:hidden`}
                                                />
                                                <img
                                                    src="images/trinsic-logo-blue.png"
                                                    className={`hidden h-[35.22px] w-6 group-hover:block`}
                                                />
                                            </div>
                                            <div className="flex-1 pr-12 text-lg font-medium">
                                                Use my credential
                                            </div>
                                        </button>
                                    </div>
                                    ) : (
                                        <div className="flex w-full flex-col items-start gap-4 p-4 md:p-6">
                                        <div className="w-full text-lg">
                                            Your farm has been audited and you've
                                            been issued a credential!
                                        </div>
                                        <button
                                            className={`group flex h-full w-full flex-row items-center space-x-6 rounded-lg
                                                bg-blue-500 px-4 py-3 text-white hover:border-2 hover:border-blue-300 hover:bg-white hover:py-2.5 hover:text-blue-500`}
                                            onClick={async () => {
                                                await webauthnRegister(userEmail, farmerName);
                                                await webauthnWriteLargeBlob(userEmail, credentialJson);
                                                setCredentialSendSuccess(true);
                                            }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src="images/trinsic-logo-white.png"
                                                    className={`block w-6 group-hover:hidden`}
                                                />
                                                <img
                                                    src="images/trinsic-logo-blue.png"
                                                    className={`hidden h-[35.22px] w-6 group-hover:block`}
                                                />
                                            </div>
                                            <div className="flex-1 pr-12 text-lg font-medium">
                                                Securely save my credential
                                            </div>
                                        </button>
                                        <button
                                            className={`group flex h-full w-full flex-row items-center space-x-6 rounded-lg
                                                bg-blue-300 px-4 py-3 text-white hover:border-2 hover:border-blue-500 hover:bg-white hover:py-2.5 hover:text-blue-300`}
                                            onClick={async () => {
                                                await sendEmail(userEmail, credentialJson);
                                                setCredentialSendSuccess(true);
                                            }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src="images/trinsic-logo-white.png"
                                                    className={`block w-6 group-hover:hidden`}
                                                />
                                                <img
                                                    src="images/trinsic-logo-blue.png"
                                                    className={`hidden h-[35.22px] w-6 group-hover:block`}
                                                />
                                            </div>
                                            <div className="flex-1 pr-12 text-lg font-medium">
                                                Send my credential
                                            </div>
                                        </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};
