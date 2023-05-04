import { useMutation } from "react-query";
import { CredentialDerivedProof } from "../../models/credential";
import { verify, purposes, extendContextLoader } from "jsonld-signatures";
import { CryptoLD } from "crypto-ld";
import {
    Bls12381G2KeyPair,
    BbsBlsSignature2020,
    BbsBlsSignatureProof2020,
    deriveProof,
} from "@mattrglobal/jsonld-signatures-bbs";
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { DID, resolve } from '@decentralized-identity/ion-tools';
import bbsContext from "./data/bbs.json";
import basicBbsContext from "./data/basic-bbs.json";
import credentialsContext from "./data/credentials.json";
import suiteContext from "./data/suiteContext.json";
import customIonIssuerContext from "./data/customIonIssuerContext.json";
import didResolutionContext from "./data/didResolutionContext.json";
import didContext from "./data/didContext.json";


// Prepare shitty crytpoLD library
// const cryptoLd = new CryptoLD();
// Install driver for Ed255192020
// cryptoLd.use(Ed25519VerificationKey2020);

const documents = {
    "https://w3id.org/security/bbs/v1": bbsContext,
    "https://w3id.org/bbs/v1": basicBbsContext,
    "https://www.w3.org/2018/credentials/v1": credentialsContext,
    "https://w3id.org/security/suites/jws-2020/v1": suiteContext,
    "https://w3id.org/did-resolution/v1": didResolutionContext,
    "https://www.w3.org/ns/did/v1": didContext,
    "did:ion:EiDa3yYaZFuVyKNQ42eHo6QuAqJKTBOaQwwaLx7RzcJODA#g2-public": customIonIssuerContext,
};

const customDocLoader = async (url: string) => {
    // @ts-ignore
    const context: any = documents[url];
    console.log("@@@@ Context @@@@", context);

    if (context) {
        return {
            contextUrl: null, // this is for a context via a link header
            document: context, // this is the actual document that was loaded
            documentUrl: url, // this is the actual context URL after redirects
        };
    }
    //   } else if (url.startsWith("did:ion")) {
    //     const didDoc = await resolve(url);
    //     console.log("@@@@ DID Doc @@@@", didDoc);
    //     return {
    //         contextUrl: null, // this is for a context via a link header
    //         document: didDoc, // this is the actual document that was loaded
    //         documentUrl: url, // this is the actual context URL after redirects
    //     }
    //   }

    console.log(
        `Attempted to remote load context : '${url}', please cache instead`
    );
    throw new Error(
        `Attempted to remote load context : '${url}', please cache instead`
    );
};

//Extended document load that uses local contexts
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const documentLoader = extendContextLoader(customDocLoader);

type VerifyCredentialProps = {
    derivedProof: CredentialDerivedProof;
};

const handleVerifyCredential = async (
    derivedProof: VerifyCredentialProps["derivedProof"]
): Promise<any> => {
    console.log(JSON.stringify(derivedProof));
    // TODO: use Mattr's open source verify instead of Trinsic's
    // mattrglobal/jsonldsignatures
    // const proof = await new ProofSet(derivedProof.proof);
    // const key = new Ed25519KeyPair(derivedProof.proof.verificationMethod);
    // const key = await cryptoLd.generate({ type: 'Ed25519VerificationKey2020' });
    // const keyPair = await new Bls12381G2KeyPair();
    // const filteredContexts = derivedProof["@context"].filter((context: string) => (typeof context === "string" ));
    // console.log("@@@@ Filtered Contexts @@@@@", filteredContexts);
    // var newDerivedProof = derivedProof;
    // newDerivedProof["@context"] = filteredContexts;
    const response = await verify(derivedProof, {
        suite: new BbsBlsSignatureProof2020(),
        purpose: new purposes.AssertionProofPurpose(),
        documentLoader
    });
    // const response = await fetch(
    //     `${process.env.REACT_APP_VERIFY_ENDPOINT}/api/trinsic/verify`,
    //     {
    //         method: "POST",
    //         body: JSON.stringify(derivedProof),
    //     }
    // );
    // const response = await fetch(
    //     `${process.env.REACT_APP_VERIFY_ENDPOINT}/api/trinsic/verify`,
    //     {
    //         method: "POST",
    //         body: JSON.stringify(derivedProof),
    //     }
    // );
    console.log("@@@@ Response @@@@@");
    console.log(JSON.stringify(response));

    if (!response.ok) {
        console.log("@@@@ Uh Oh... @@@@@");
        throw Error("Unable to verify credential.");
    }

    return await response.json();
};

export const useVerifyCredential = (onError?: () => void) => {
    return useMutation(
        ({ derivedProof }: VerifyCredentialProps) =>
            handleVerifyCredential(derivedProof),
        {
            onSuccess: () => { },
            // TODO: Better error messaging
            onError: (err) => {
                window.alert(err);
                onError?.();
            },
        }
    );
};
